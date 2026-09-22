import axios from "axios";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchCuaca(adm4) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`;
  const maxRetries = 4; // batas BMKG 60 req/menit, antisipasi 429

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AutoCuaca/1.0; +https://github.com/)",
          Accept: "application/json",
        },
      });

      const lokasi = res.data?.lokasi;
      const days = res.data?.data?.[0]?.cuaca;

      if (!lokasi || !Array.isArray(days)) {
        throw new Error("Struktur data BMKG tidak valid");
      }

      return {
        adm4,
        lokasi,
        days, // array 3 hari, tiap hari = array slot per 3 jam
        analysisDate: days[0]?.[0]?.analysis_date || "-",
      };
    } catch (err) {
      const status = err.response?.status;

      if (status !== 429) {
        console.error(`Gagal fetch cuaca ${adm4}:`, status || "", err.message);
        return null;
      }

      if (attempt === maxRetries) {
        console.error(`BMKG tetap 429 setelah retry untuk ${adm4}.`);
        return null;
      }

      const retryAfter = err.response?.headers?.["retry-after"];
      const delay = retryAfter ? Number(retryAfter) * 1000 || 5000 : 2000 * 2 ** attempt;

      console.warn(`Rate limit 429. Retry ${attempt + 1}/${maxRetries} dalam ${delay}ms`);
      await sleep(delay);
    }
  }

  return null;
}