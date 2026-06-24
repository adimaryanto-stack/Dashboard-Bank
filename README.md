# Dashboard Bank 🏛️

Sistem informasi modern bergaya *spreadsheet* untuk pemantauan, alokasi, dan pencairan dana Anggaran Pendapatan dan Belanja Negara (APBN) di sektor Pendidikan Indonesia oleh Bank Penyalur.

Aplikasi ini menyajikan *dashboard* dengan performa tinggi yang terintegrasi langsung dengan database **Supabase**, memungkinkan instansi perbankan (Super Admin, Admin regional, Admin Area) dan auditor memantau serta menyalurkan alokasi dana secara berjenjang dan *real-time* langsung ke rekening sekolah penerima.

---

## ✨ Fitur Utama

- **Penyaluran Berjenjang (Hierarki)**: Pemantauan dana mulai dari **Pagu Pusat (APBN) ➡️ Penyaluran Wilayah (Provinsi) ➡️ Penyaluran Area (Kabupaten/Kota) ➡️ Rekening Sekolah**.
- **Antarmuka Bergaya Spreadsheet**: 
  - Input data nominal dan realisasi secara langsung *(inline editing)*.
  - Perhitungan **Selisih** dan **Persentase Penyerapan** otomatis secara kaskade ke database.
  - Tombol modal **Tambah Provinsi** untuk menambahkan wilayah baru beserta pagu alokasi langsung ke tabel Supabase.
- **Skema Penyaluran Triwulan (Quarterly)**: Menampilkan detail pencairan dana sekolah per triwulan (Q1, Q2, Q3, Q4) beserta status keberhasilan transfer.
- **Visualisasi Data**: *Dashboard* analitik dengan metrik utama perbankan (Total Pagu, Dana Cair, % Penyaluran) dan grafik tren tahunan menggunakan *Recharts*.
- **Desain Modern (Glassmorphism)**: UI/UX premium dengan *Light Mode*, efek *frosted glass* (transparan-blur), serta aksen warna biru-indigo khas perbankan.
- **Manajemen Pengguna (RBAC)**: Role-Based Access Control (Super Admin, Admin Bank Pusat, Admin Bank Regional, Admin Bank Area, Viewer Eksternal, Internal Auditor Bank) terintegrasi langsung dengan tabel user Supabase.

---

## 🛠️ Stack Teknologi

Sistem ini dibangun menggunakan ekosistem *web modern* dengan performa tinggi:

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & React 19
- **Database Backend**: `@supabase/supabase-js` (Supabase Direct SDK Connection)
- **Bahasa**: TypeScript (Strict Typing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan arsitektur variabel berbasis `@theme`.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Ikon & Grafik**: Lucide React & Recharts
- **Ekspor Data**: CSV Export

---

## 📂 Struktur Proyek

```text
dashboard-bank/
├── app/                  # Next.js App Router (Halaman & Layout)
│   ├── dashboard/        # Halaman utama aplikasi (APBN, Provinsi, Kab/Kota, dll.)
│   ├── globals.css       # Root stylesheet (Tailwind v4 tokens & utility classes)
│   └── layout.tsx        # Root layout (Provider & Font)
├── components/           # Komponen UI Reusable
│   ├── layout/           # Sidebar, Header, Shell
│   └── ui/               # PctBadge, StatusBadge, MetricCard, dll.
├── lib/                  # Utilitas, Database Client, dan Layer Data
│   ├── data/             # Query & mutasi langsung ke database Supabase
│   ├── store.ts          # Global state management (Zustand)
│   ├── supabase.ts       # Inisialisasi Supabase Client
│   └── utils/            # Fungsi format mata uang, persentase, class merger (clsx)
├── PRD.md                # Product Requirements Document
├── MVP.md                # MVP Roadmap & Checklist (100% Completed)
├── CHANGELOG.md          # Changelog histori versi rilis
└── types/                # Definisi tipe data TypeScript (Interface)
```

---

## 🚀 Memulai Pengembangan (Development)

### Prasyarat
Pastikan Anda memiliki [Node.js](https://nodejs.org/) (versi 18+ disarankan) terinstal di sistem Anda.

### Langkah Instalasi

1. **Clone repository ini**
   ```bash
   git clone https://github.com/adimaryanto-stack/Dashboard-Bank.git
   cd Dashboard-Bank
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Pastikan file `.env.local` di root folder sudah terisi dengan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://jpytxmnxbicjmgsgprba.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

5. **Akses Aplikasi**
   Buka [http://localhost:3003](http://localhost:3003) di browser Anda. Rute utama aplikasi berada pada `/dashboard`.

---

## 📷 Screenshots Aplikasi (Localhost)

Berikut adalah beberapa tampilan utama dari **Dashboard Bank** yang berjalan secara lokal pada port **3003**:

| 📊 Halaman Utama Dashboard | 💰 Pengelolaan Pagu Pusat |
|:---:|:---:|
| ![Dashboard](./public/screenshots-v1.5.0/01-dashboard.png) | ![Pagu Pusat](./public/screenshots-v1.5.0/02-apbn.png) |
| *Ringkasan Penyaluran Dana Pendidikan, Chart Tren, & Progress Bar* | *Manajemen status tahun anggaran pagu pusat (Draft, Active, Closed)* |

| 📍 Penyaluran Wilayah (Provinsi) | 🏛️ Penyaluran Area (Kabupaten / Kota) |
|:---:|:---:|
| ![Penyaluran Wilayah](./public/screenshots-v1.5.0/03-provinsi.png) | ![Penyaluran Area](./public/screenshots-v1.5.0/04-kabupaten-kota.png) |
| *Tabel spreadsheet interaktif tingkat provinsi dengan Inline Editing & Tambah Provinsi* | *Tabel spreadsheet tingkat Kabupaten/Kota dengan filter cascading per wilayah* |

| 🎓 Detail Kategori Sekolah | 👥 Manajer Pengguna |
|:---:|:---:|
| ![Kategori Sekolah](./public/screenshots-v1.5.0/05-universitas.png) | ![Manajer Pengguna](./public/screenshots-v1.5.0/06-users.png) |
| *Detail alokasi, realisasi, & status transfer per sekolah dengan pagination & search* | *Manajemen user bank lengkap dengan pengaturan Role perbankan & Status* |

---

## 📖 Dokumentasi Lengkap (PRD)

Dokumentasi rancangan produk, arsitektur, skema database, dan peta jalan (roadmap) pengembangan telah disediakan pada berkas berikut:
- Cek file **[`PRD.md`](./PRD.md)**
- Detail target/checklist fungsionalitas minimal layak produk: **[`MVP.md`](./MVP.md)**
- Histori versi dan log perubahan: **[`CHANGELOG.md`](./CHANGELOG.md)**
