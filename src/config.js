import dotenv from "dotenv";
dotenv.config();

// Kosongkan saja jika tidak ingin notifikasi Discord (README tetap update)
export const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

// Daftar lokasi pantauan (kode adm4 sesuai Kepmendagri 100.1.1-6117/2022)
export const LOCATIONS = [
  {
    key: "tuban",
    label: "Tuban Kota",
    adm4: "35.23.16.1007", // Kel. Karangsari, Kec. Tuban, Kab. Tuban
  },
  {
    key: "gresik",
    label: "Gresik Kota",
    adm4: "35.25.16.1008", // Kel. Trate, Kec. Gresik, Kab. Gresik
  },
];