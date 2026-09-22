import fs from "fs";
import { LOCATIONS, WEBHOOK_URL } from "./config.js";
import { fetchCuaca } from "./fetchCuaca.js";
import { readState, writeState } from "./storage.js";
import { sendToDiscord } from "./notifier.js";
import { updateReadme } from "./readme.js";

// Signature = waktu analisis BMKG + slot pertama → berubah hanya saat BMKG rilis data baru
const signature = (fc) => `${fc.analysisDate}|${fc.days[0]?.[0]?.local_datetime || ""}`;

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

  if (results.length === 0) {
    console.log("Tidak ada data cuaca sama sekali. Skip.");
    return;
  }

  const state = readState();
  const newState = { ...state };
  let anyChange = false;

  for (const { loc, fc } of results) {
    const sig = signature(fc);

    if (state[loc.key] === sig) {
      console.log(`✅ ${loc.label}: data belum berubah (analisis ${fc.analysisDate}).`);
      continue;
    }

    newState[loc.key] = sig;
    anyChange = true;
    console.log(`🆕 ${loc.label}: analisis BMKG baru → kirim webhook.`);
    await sendToDiscord(loc, fc);
  }

  if (anyChange || !fs.existsSync("README.md")) {
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