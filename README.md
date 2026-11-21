# 🌦️ AutoCuaca — Prakiraan Cuaca Tuban & Gresik

> Prakiraan cuaca resmi **BMKG** (3 hari ke depan, interval 3 jam) untuk wilayah **Tuban Kota** dan **Gresik Kota**, diperbarui otomatis oleh GitHub Actions dan ditampilkan langsung di README ini.

🕒 **Update terakhir:** Sabtu, 21 November 2026 pukul 14.28.53
🛰️ **Analisis data BMKG:** -
📡 **Sumber data:** [BMKG — Data Prakiraan Cuaca Terbuka](https://data.bmkg.go.id/prakiraan-cuaca/)

---

## ⚡ Kondisi Slot Berikutnya

| Lokasi | Cuaca | Suhu | Kelembapan | Angin | Jam |
| --- | --- | --- | --- | --- | --- |



---

## 📍 Tuban Kota

> Karangsari, Kec. Tuban, Kab. Tuban, Jawa Timur
> 🧭 Koordinat: -6.8870491603, 112.0525513055 • ⏰ Zona waktu: Asia/Jakarta • 🆔 adm4: `35.23.16.1007`



### 🗓️ Ringkasan 3 Hari

| Hari | Cuaca Dominan | Suhu | Kelembapan |
| --- | --- | --- | --- |


---

## 📍 Gresik Kota

> Trate, Kec. Gresik, Kab. Gresik, Jawa Timur
> 🧭 Koordinat: -7.1556599248, 112.6520972518 • ⏰ Zona waktu: Asia/Jakarta • 🆔 adm4: `35.25.16.1008`



### 🗓️ Ringkasan 3 Hari

| Hari | Cuaca Dominan | Suhu | Kelembapan |
| --- | --- | --- | --- |


---


## 📍 Lokasi Dipantau

| Kota | Kelurahan/Desa | Kecamatan | Kab/Kota | adm4 |
| --- | --- | --- | --- | --- |
| Tuban Kota | Karangsari | Tuban | Tuban | `35.23.16.1007` |
| Gresik Kota | Trate | Gresik | Gresik | `35.25.16.1008` |

## 🛠️ Cara Kerja Repository Ini

- Workflow `.github/workflows/cuaca.yml` berjalan otomatis setiap **30 menit**.
- `src/index.js` mengambil data dari API publik BMKG `api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...`.
- **Pembaruan README**: di-generate ulang otomatis saat BMKG merilis analisis baru (±2 kali sehari) atau saat slot jam cuaca aktif bergeser (interval 3 jam).
- **Notifikasi Discord**: dikirim per kota **hanya saat BMKG merilis analisis baru** agar tidak spam.
- Signature dan slot terakhir disimpan di `data/last-cuaca.json`, lalu di-commit & push otomatis ke branch `main`.

---

<div align="center">

Dibuat dengan ❤️ oleh [RusdiEneri](https://github.com/RusdiEneri) • Sumber data: [BMKG](https://www.bmkg.go.id/)

_README ini dibuat otomatis oleh GitHub Actions — jangan edit manual._

</div>
