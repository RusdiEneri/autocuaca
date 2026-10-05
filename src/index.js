import fs from "fs";
import { LOCATIONS, WEBHOOK_URL } from "./config.js";
import { fetchCuaca } from "./fetchCuaca.js";
import { readState, writeState } from "./storage.js";
import { sendToDiscord } from "./notifier.js";
import { updateReadme, nextSlot } from "./readme.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Normalisasi entri state agar kompatibel dengan versi sebelumnya (string atau objek)
function parseEntry(entry) {
  if (!entry) return { analysisDate: "", slot: "" };
  if (typeof entry === "object") {
    return {
      analysisDate: entry.analysisDate || "",
      slot: entry.slot || "",
    };
  }
  const parts = String(entry).split("|");
  return {
    analysisDate: parts[0] || "",
    slot: parts[1] || "",
  };
}

async function main() {
  console.log("AutoCuaca Monitor started...");

  const results = [];
  for (const loc of LOCATIONS) {
    const fc = await fetchCuaca(loc.adm4);
    if (!fc) {
      console.log(`⚠️ Gagal mengambil data untuk ${loc.label}.`);
      continue;
    }
    results.push({ loc, fc });
  }

  // Guard kelengkapan: jangan update README jika ada lokasi yang gagal diambil
  if (results.length < LOCATIONS.length) {
    console.log(
      `⚠️ Hanya ${results.length}/${LOCATIONS.length} lokasi berhasil diambil. Skip update agar README/state tidak parsial.`
    );
    return;
  }

  const state = readState();
  const newState = { ...state };
  let readmeNeedsUpdate = false;
  const notifiedLocations = [];

  for (const { loc, fc } of results) {
    const currentAnalysis = fc.analysisDate;
    const currentSlot = nextSlot(fc)?.local_datetime || "";
    const prev = parseEntry(state[loc.key]);

    const isNewAnalysis = prev.analysisDate !== currentAnalysis;
    const isNewSlot = prev.slot !== currentSlot;

    if (isNewAnalysis) {
      console.log(`🆕 ${loc.label}: analisis BMKG baru (${currentAnalysis}) → jadwalkan webhook & update README.`);
      notifiedLocations.push({ loc, fc });
      readmeNeedsUpdate = true;
    } else if (isNewSlot) {
      console.log(`⏰ ${loc.label}: slot cuaca aktif bergeser (${prev.slot || "awal"} → ${currentSlot}) → update README.`);
      readmeNeedsUpdate = true;
    } else {
      console.log(`✅ ${loc.label}: data identik (analisis ${currentAnalysis}, slot ${currentSlot}).`);
    }

    newState[loc.key] = {
      analysisDate: currentAnalysis,
      slot: currentSlot,
    };
  }

  // Kirim notifikasi Discord hanya untuk lokasi dengan analisis BMKG baru (agar tidak spam)
  for (let i = 0; i < notifiedLocations.length; i++) {
    const { loc, fc } = notifiedLocations[i];
    await sendToDiscord(loc, fc);
    if (i < notifiedLocations.length - 1) {
      await sleep(1000);
    }
  }

  const readmeMissing = !fs.existsSync("README.md");
  if (readmeNeedsUpdate || readmeMissing) {
    updateReadme(results);
    writeState(newState);
    console.log("📄 README.md + data/last-cuaca.json diperbarui.");
  } else {
    console.log("Tidak ada perubahan → tidak akan ada commit.");
  }

  if (!WEBHOOK_URL) {
    console.log("ℹ️ WEBHOOK_URL kosong: notifikasi Discord dilewati.");
  }
}

try {
  await main();
  console.log("AutoCuaca Monitor finished.");
  process.exit(0);
} catch (err) {
  console.error("Fatal error:", err);
  process.exit(1);
}