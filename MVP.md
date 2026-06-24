# MVP Roadmap & Checklist — Dashboard Bank

Dokumen ini melacak fitur-fitur Minimum Viable Product (MVP) yang direncanakan dan diimplementasikan untuk aplikasi **Dashboard Bank** (versi `1.5.0`). Seluruh fitur inti di bawah ini telah berhasil dikembangkan dan diintegrasikan secara langsung dengan Supabase.

---

## 📈 Status MVP: 100% Selesai (Production-Ready Supabase Integration)

Berikut adalah daftar sprint pengembangan dan status checklist fungsionalitas:

### 🏁 SPRINT 1: Setup & UI Foundation
- [x] Konfigurasi Next.js 16 + Tailwind CSS v4 dengan arsitektur variabel `@theme`.
- [x] Pembuatan tata letak global (Sidebar, Header, Shell) dengan desain modern & glassmorphism.
- [x] Setup state management global menggunakan **Zustand** untuk sinkronisasi tahun anggaran aktif.
- [x] Implementasi skema warna perbankan premium, logo bank penyalur, dan efek frosted glass.

### 💰 SPRINT 2: Dashboard & APBN Pagu Pusat
- [x] Metric cards utama (Total Pagu Pusat, Total Dana Cair, % Penyaluran Sukses) dengan tren komparatif.
- [x] Visualisasi grafik menggunakan **Recharts** (Bar Chart Pagu Pusat vs Dana Cair, Area Chart Tren Penyaluran Dana Pendidikan 2020–2026).
- [x] Halaman Kelola Pagu Pusat (APBN) per tahun untuk mengelola status tahun anggaran (`DRAFT`, `ACTIVE`, `CLOSED`).
- [x] Validasi status tahun anggaran (hanya 1 tahun yang dapat berstatus `ACTIVE` dalam satu waktu).

### 📍 SPRINT 3: Spreadsheet Penyaluran Wilayah & Area
- [x] Halaman spreadsheet Penyaluran Wilayah (Provinsi) dengan antarmuka bergaya Excel.
- [x] Fitur inline editing langsung pada cell nominal alokasi dan realisasi (data disimpan & di-update langsung ke database Supabase).
- [x] Modal Tambah Provinsi & Alokasi Pagu Baru secara langsung ke database.
- [x] Perhitungan selisih (`Nominal - Realisasi`) dan persentase penyerapan secara real-time.
- [x] Halaman spreadsheet Penyaluran Area (Kabupaten/Kota) dengan filter cascading per provinsi.
- [x] Sinkronisasi data cascading dari wilayah ke area secara real-time.

### 🎓 SPRINT 4: Kategori & Rekening Sekolah (Disbursement Details)
- [x] Halaman sub-menu berjenjang/kategori (Universitas, SMA, SMP, SD, PAUD) dengan daftar sekolah lengkap.
- [x] Fitur pencarian sekolah berdasarkan NPSN/Nama Sekolah, filter bertingkat, dan pagination.
- [x] Detail Rekening Sekolah (Profil Institusi) menampilkan grafik pengeluaran bulanan dan alokasi per sumber dana.
- [x] Integrasi skema penyaluran triwulanan (quarterly disbursements) dan rincian transaksi pengeluaran.
- [x] Fungsionalitas **Ekspor CSV** untuk data spreadsheet provinsi/wilayah dan kategori sekolah.

### 👥 SPRINT 5: Manajer Pengguna & RBAC (Role-Based Access Control)
- [x] Pembuatan halaman Manajer Pengguna dengan data user yang dimuat langsung dari database Supabase.
- [x] Operasi CRUD user (Tambah, Edit, Hapus, Aktif/Nonaktifkan akun) terintegrasi langsung dengan Supabase.
- [x] Implementasi Role-Based Access Control (Super Admin, Admin Bank Pusat, Admin Bank Regional, Admin Bank Area, Viewer Eksternal, Internal Auditor Bank).
- [x] Pembatasan menu dan aksi edit data (inline editing terkunci untuk viewer/auditor atau cakupan wilayah yang tidak sesuai).

---

## 📷 Screenshots Validasi

Semua halaman di atas telah dijalankan dan diverifikasi pada `http://localhost:3003`. Cuplikan gambar layar telah dilampirkan di file **[`README.md`](./README.md)** untuk referensi cepat.

---

## 🚀 Langkah Selanjutnya (Post-MVP)
- [x] Integrasi penuh dengan Supabase Database (Live PostgreSQL Client SDK).
- [ ] Autentikasi Pengguna nyata (NextAuth.js / Supabase Auth).
- [ ] Fitur Progressive Web App (PWA) untuk mendukung akses offline.
- [ ] Log Audit (Audit Trail) untuk merekam histori edit data per sel secara terperinci.
