import axios from "axios";
import { WEBHOOK_URL } from "./config.js";
import { weatherEmoji, windDirId, isRain } from "./readme.js";

const jamWib = (ldt) => String(ldt).slice(11, 16);

export async function sendToDiscord(loc, fc) {
  if (!WEBHOOK_URL) return false;

  const L = fc.lokasi;
  const today = fc.days[0] || []; // sisa slot hari ini
  const rain = today.some((s) => isRain(s.weather_desc));

  const payload = {
    embeds: [
      {
        title: `🌦️ Prakiraan Cuaca ${loc.label} Diperbarui`,
        description:
          `📍 **${L.desa}, Kec. ${L.kecamatan}, Kab. ${L.kotkab}, ${L.provinsi}**\n` +
          `🧭 Koordinat: ${L.lat}, ${L.lon}\n` +
          `🛰️ Analisis BMKG: ${fc.analysisDate} UTC\n` +
          `🔗 Detail: https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${L.adm4}`,
        color: rain ? 0x3498db : 0xf1c40f,
        fields: today.slice(0, 8).map((s) => ({
          name: `🕒 ${jamWib(s.local_datetime)} WIB`,
          value:
            `${weatherEmoji(s.weather_desc)} ${s.weather_desc} — ` +
            `🌡️ ${s.t}°C | 💧 ${s.hu}% | 💨 ${s.ws} km/j dari ${windDirId(s.wd)}`,
          inline: false,
        })),
        footer: { text: "Sumber: BMKG — data.bmkg.go.id/prakiraan-cuaca" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log(`📨 Webhook terkirim untuk ${loc.label}.`);
    return true;
  } catch (err) {
    console.error(`Gagal kirim webhook ${loc.label}:`, err.message);
    return false;
  }
}