import fs from "fs";
import path from "path";

const README_PATH = path.resolve("README.md");

const WD_ID = {
  N: "Utara", NE: "Timur Laut", E: "Timur", SE: "Tenggara",
  S: "Selatan", SW: "Barat Daya", W: "Barat", NW: "Barat Laut",
};

const EMOJI = {
  "Cerah": "☀️",
  "Cerah Berawan": "🌤️",
  "Berawan": "☁️",
  "Berawan Tebal": "🌥️",
  "Hujan Ringan": "🌦️",
  "Hujan Sedang": "🌧️",
  "Hujan Lebat": "⛈️",
  "Hujan Petir": "⛈️",
  "Petir": "⚡",
  "Kabut": "🌫️",
  "Udara Kabur": "🌫️",
};

export const weatherEmoji = (desc) => EMOJI[desc] || "🌦️";
export const windDirId = (wd) => WD_ID[wd] || wd || "-";
export const isRain = (desc) => /hujan|petir/i.test(desc || "");

// URL ikon BMKG bisa mengandung spasi → wajib encode %20 agar valid di Markdown
export const iconUrl = (slot) => (slot?.image ? slot.image.replace(/ /g, "%20") : "");

const jamWib = (localDatetime) => String(localDatetime).slice(11, 16);

function tanggalId(localDatetime) {
  const d = new Date(String(localDatetime).replace(" ", "T") + "+07:00");
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(d);
}

function nowWibString() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function nextSlot(fc) {
  const now = nowWibString();
  for (const day of fc.days) {
    for (const s of day) {
      if (s.local_datetime >= now) return s;
    }
  }
  return fc.days[0]?.[0] || null;
}

function daySummary(slots) {
  const temps = slots.map((s) => s.t);
  const hus = slots.map((s) => s.hu);
  const count = {};
  for (const s of slots) count[s.weather_desc] = (count[s.weather_desc] || 0) + 1;
  const dominant = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  return {
    min: Math.min(...temps),
    max: Math.max(...temps),
    huMin: Math.min(...hus),
    huMax: Math.max(...hus),
    dominant,
  };
}

function locationSection(loc, fc) {
  const L = fc.lokasi;

  const dayBlocks = fc.days
    .map((slots) => {
      if (!slots?.length) return "";
      const rows = slots
        .map((s) => {
          const icon = iconUrl(s);
          const img = icon ? `<img src="${icon}" width="22" alt="${s.weather_desc}"> ` : "";
          return `| ${jamWib(s.local_datetime)} | ${img}${weatherEmoji(s.weather_desc)} ${s.weather_desc} | ${s.t}°C | ${s.hu}% | ${s.ws} km/j | dari ${windDirId(s.wd)} | ${s.vs_text ?? "–"} |`;
        })
        .join("\n");

      return `### 📅 ${tanggalId(slots[0].local_datetime)}

| 🕒 Jam (WIB) | ☁️ Cuaca | 🌡️ Suhu | 💧 Kelembapan | 💨 Angin | 🧭 Arah | 👁️ Jarak Pandang |
| --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
    })
    .join("\n");

  const sumRows = fc.days
    .map((slots) => {
      if (!slots?.length) return "";
      const sum = daySummary(slots);
      return `| ${tanggalId(slots[0].local_datetime)} | ${weatherEmoji(sum.dominant)} ${sum.dominant} | ${sum.min}–${sum.max}°C | ${sum.huMin}–${sum.huMax}% |`;
    })
    .join("\n");

  return `## 📍 ${loc.label}

> ${L.desa}, Kec. ${L.kecamatan}, Kab. ${L.kotkab}, ${L.provinsi}
> 🧭 Koordinat: ${L.lat}, ${L.lon} • ⏰ Zona waktu: ${L.timezone} • 🆔 adm4: \`${L.adm4}\`

${dayBlocks}

### 🗓️ Ringkasan 3 Hari

| Hari | Cuaca Dominan | Suhu | Kelembapan |
| --- | --- | --- | --- |
${sumRows}

---
`;
}

export function buildReadme(results) {
  const nowWib = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  const analysisList = [...new Set(results.map((r) => r.fc.analysisDate))].join(", ");

  const quickRows = results
    .map(({ loc, fc }) => {
      const s = nextSlot(fc);
      if (!s) return "";
      return `| ${loc.label} | <img src="${iconUrl(s)}" width="22"> ${weatherEmoji(s.weather_desc)} ${s.weather_desc} | ${s.t}°C | ${s.hu}% | ${s.ws} km/j | ${jamWib(s.local_datetime)} WIB |`;
    })
    .join("\n");

  const locRows = results
    .map(({ loc, fc }) => {
      const L = fc.lokasi;
      return `| ${loc.label} | ${L.desa} | ${L.kecamatan} | ${L.kotkab} | \`${L.adm4}\` |`;
    })
    .join("\n");

  const sections = results.map(({ loc, fc }) => locationSection(loc, fc)).join("\n");

  return `# 🌦️ AutoCuaca — Prakiraan Cuaca Tuban & Gresik

> Prakiraan cuaca resmi **BMKG** (3 hari ke depan, interval 3 jam) untuk wilayah **Tuban Kota** dan **Gresik Kota**, diperbarui otomatis oleh GitHub Actions dan ditampilkan langsung di README ini.

🕒 **Update terakhir:** ${nowWib}
🛰️ **Analisis data BMKG:** ${analysisList}
📡 **Sumber data:** [BMKG — Data Prakiraan Cuaca Terbuka](https://data.bmkg.go.id/prakiraan-cuaca/)

---

## ⚡ Kondisi Slot Berikutnya

| Lokasi | Cuaca | Suhu | Kelembapan | Angin | Jam |
| --- | --- | --- | --- | --- | --- |
${quickRows}

---

${sections}

## 📍 Lokasi Dipantau

| Kota | Kelurahan/Desa | Kecamatan | Kab/Kota | adm4 |
| --- | --- | --- | --- | --- |
${locRows}

## 🛠️ Cara Kerja Repository Ini

- Workflow \`.github/workflows/cuaca.yml\` berjalan otomatis setiap **30 menit**.
- \`src/index.js\` mengambil data dari API publik BMKG \`api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...\`.
- Jika BMKG merilis analisis baru (±2 kali sehari):
  - \`README.md\` di-generate ulang lengkap dengan ikon cuaca,
  - notifikasi **Discord webhook** dikirim per kota,
  - signature disimpan di \`data/last-cuaca.json\` agar tidak spam,
  - semuanya di-commit & push otomatis ke branch \`main\`.

---

<div align="center">

Dibuat dengan ❤️ oleh [RusdiEneri](https://github.com/RusdiEneri) • Sumber data: [BMKG](https://www.bmkg.go.id/)

_README ini dibuat otomatis oleh GitHub Actions — jangan edit manual._

</div>
`;
}

export function updateReadme(results) {
  fs.writeFileSync(README_PATH, buildReadme(results), "utf8");
}