# Changelog — Dashboard Bank

Semua perubahan penting pada proyek **Dashboard Bank** didokumentasikan di file ini. Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan mematuhi penomoran [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 24-06-2026

### Ditambahkan
- Ditambahkan screenshot fungsionalitas aplikasi di localhost (Port 3003) yang dirujuk ke dalam `README.md`.
- Ditambahkan file target roadmap/checklist minimal layak produk [`MVP.md`](./MVP.md) ke struktur project.
- Ditambahkan file target spesifikasi produk [`PRD.md`](./PRD.md) di root project untuk menggantikan dokumen sebelumnya.

### Diubah
- Mengubah nama project resmi dan seluruh referensi dokumen menjadi **Dashboard Bank** secara konsisten.
- Memperbarui label navigasi sidebar dan footer untuk menyelaraskan ke versi **1.5.0**.
- Menyesuaikan penomoran versi di `package.json` dan `package-lock.json` menjadi `1.5.0`.
- Menghapus folder `PRD/` lama beserta file `MASTER_PRD.md` untuk menjaga kebersihan struktur repositori.

---

## [1.4.0] - 20-06-2026

### Ditambahkan
- Ditambahkan fitur CRUD lengkap untuk **Tambah Provinsi & Pagu Alokasi** langsung di spreadsheet wilayah melalui modal dialog.
- Ditambahkan fungsionalitas **Ekspor CSV** penuh untuk data provinsi/wilayah dengan format terstruktur.
- Ditambahkan navigasi dinamis pada daftar notifikasi di Header, memungkinkan redirect langsung ke target modul (misal ke APBN, Provinsi, dll).

---

## [1.3.0] - 13-06-2026

### Ditambahkan
- Integrasi penuh dengan database **Supabase Direct (PostgreSQL SDK)** untuk operasi data APBN, Provinsi, Kab/Kota, Institusi, dan data Pengeluaran secara real-time.
- Pembersihan library backend InsForge dan folder `.insforge/` agar aplikasi berjalan mandiri.
- Mengubah port development default Next.js menjadi **3003** pada file `.env.local` dan skrip dev.

### Diubah
- Rebranding tampilan visual dashboard dan sidebar menjadi **Dashboard Bank** (Bank Penyalur).
- Mengubah skema penyaluran dana bulanan menjadi triwulanan (quarterly disbursements) sesuai standar perbankan penyalur.

---

## [1.0.0] - 13-05-2026

### Ditambahkan
- Rilis inisial Dashboard Anggaran Pendidikan Indonesia dengan antarmuka spreadsheet interaktif, visualisasi diagram dengan Recharts, dan pengelolaan User Manager (RBAC).
