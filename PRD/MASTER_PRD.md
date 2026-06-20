# PRD & MVP Roadmap — Sistem Transparansi Anggaran Pendidikan Indonesia
**Version:** 4.0 (Consolidated Master PRD)  
**Date:** 20 Juni 2026  
**Status:** ✅ APPROVED FOR DEVELOPMENT  
**Project Type:** Web-Based Spreadsheet Dashboard — Education Budget Transparency
**Database Backend:** Supabase Direct (PostgreSQL)

---

## DAFTAR ISI

1. [Project Overview](#1-project-overview)
2. [Menu Structure](#2-menu-structure)
3. [Fitur per Menu](#3-fitur-per-menu)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Tech Stack & Frontend Structure](#6-tech-stack--frontend-structure)
7. [System Diagrams](#7-system-diagrams)
8. [MVP Roadmap — 4 Sprint (8 Minggu)](#8-mvp-roadmap--4-sprint-8-minggu)
9. [Success Metrics](#9-success-metrics)
10. [Deployment & Verification Plan](#10-deployment--verification-plan)

---

## 1. Project Overview

### 1.1 Deskripsi Aplikasi
Sistem Transparansi Anggaran Pendidikan adalah aplikasi web berbasis **spreadsheet interface** untuk menampilkan, mengelola, dan mengaudit aliran dana pendidikan Indonesia dari tingkat nasional (APBN) hingga institusi pendidikan di seluruh daerah. Tampilannya menyerupai Excel/Google Sheets dengan semua kalkulasi angka terhubung secara real-time antar menu dan database.

### 1.2 Target User & Role

| Role | Akses | Keterangan |
|------|-------|------------|
| `SUPER_ADMIN` | Full access | Semua menu, termasuk User Manager |
| `ADMIN` | Create, Read, Update | Semua menu data anggaran |
| `ADMIN_PROVINSI` | CRUD untuk provinsinya | Terbatas pada wilayah provinsi |
| `ADMIN_KABKOTA` | CRUD untuk kabkotanya | Terbatas pada wilayah kabkota |
| `VIEWER` | Read-only | Semua menu, tidak bisa edit |
| `AUDITOR` | Read-only + Export | Semua menu, fokus audit trail |

### 1.3 Core Concept: Spreadsheet-Like Interface
- **Tampilan seperti Excel** — table rows & columns, sticky header & footer.
- **Inline Editing** — klik sel angka langsung edit, tekan Enter/Tab untuk simpan.
- **Kalkulasi Real-Time** — `Selisih = Nominal − Realisasi`, `% = (Realisasi / Nominal) × 100`.
- **Conditional Formatting** — badge warna: 🟢 ≥80%, 🟡 50–79%, 🔴 <50%.
- **Direct Supabase Integration** — Mengambil dan memperbarui data secara langsung ke Supabase client-side / server-side.
- **Export Excel** — download `.xlsx` dengan formula Excel tersimpan, bukan nilai statis.

---

## 2. Menu Structure

```
📊 Dashboard (Main)
   └── Ringkasan nasional: Nominal, Realisasi, % + Chart

💰 APBN Pertahun
   └── Kelola tahun anggaran: DRAFT → ACTIVE → CLOSED

📍 Provinsi
   └── Spreadsheet 38 provinsi, inline editing

🏛️ Kabupaten / Kota
   └── Filter per provinsi, inline editing

🎓 Jenjang Pendidikan
   ├── Universitas
   ├── SMA
   ├── SMP
   ├── SD
   └── PAUD

👥 User Manager
   └── CRUD users + role assignment
```

---

## 3. Fitur per Menu

### 3.1 Dashboard
- 3 metric card: Total Nominal, Total Realisasi, % Penyerapan Nasional.
- Tabel ringkasan per jenjang dengan progress bar.
- Bar chart Nominal vs Realisasi per jenjang (Recharts).
- Line chart tren APBN 2020–2026 (Recharts).
- Dropdown tahun anggaran (header kanan atas, global).
- Auto-refresh saat data di menu lain berubah.

### 3.2 APBN Pertahun
- Menambah tahun anggaran baru (status awal DRAFT).
- Mengaktifkan tahun anggaran (hanya boleh ada 1 tahun yang ACTIVE).
- Menutup tahun anggaran (status CLOSED, data dikunci menjadi read-only).
- Mengedit pagu pusat untuk status DRAFT atau ACTIVE.

### 3.3 Provinsi
- Spreadsheet 38 provinsi di Indonesia.
- Edit langsung pagu alokasi dan realisasi pada baris provinsi.
- Auto-save saat blur/Enter dengan validasi tipe data.
- Ekspor data provinsi ke Excel.

### 3.4 Kabupaten / Kota
- Dropdown Provinsi di bagian atas untuk memfilter data kabupaten/kota.
- Spreadsheet kabupaten/kota di provinsi terpilih.
- Edit nominal alokasi dan realisasi per kabupaten/kota dengan auto-save.

### 3.5 Jenjang Pendidikan (Sub-Menus)
- Terdapat 5 sub-menu: Universitas, SMA, SMP, SD, PAUD.
- Menampilkan data sekolah dengan NPSN, Nama Sekolah, Alokasi Pagu, Dana Cair, Selisih, dan % Penyerapan.
- Pencarian berdasarkan Nama Sekolah atau NPSN.
- Filter bertingkat berdasarkan Provinsi dan Kabupaten/Kota.
- Pagination untuk menangani jumlah data sekolah yang besar.

---

## 4. Database Schema (PostgreSQL di Supabase)

### 4.1 Tabel Core Anggaran
```sql
-- Tahun Anggaran
CREATE TABLE tahun_anggaran (
  id          TEXT PRIMARY KEY,
  tahun       INTEGER UNIQUE NOT NULL,
  total_anggaran BIGINT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Provinsi
CREATE TABLE provinsi (
  id            TEXT PRIMARY KEY,
  kode_provinsi TEXT UNIQUE NOT NULL,
  nama_provinsi TEXT NOT NULL
);

-- Alokasi Provinsi
CREATE TABLE alokasi_provinsi (
  id                TEXT PRIMARY KEY,
  tahun_anggaran_id TEXT REFERENCES tahun_anggaran(id),
  provinsi_id       TEXT REFERENCES provinsi(id),
  nominal_alokasi   BIGINT NOT NULL,
  realisasi_total   BIGINT DEFAULT 0,
  selisih           BIGINT GENERATED ALWAYS AS (nominal_alokasi - realisasi_total) STORED,
  persentase_penyerapan NUMERIC GENERATED ALWAYS AS (
                      CASE WHEN nominal_alokasi > 0 THEN (realisasi_total::numeric / nominal_alokasi::numeric) * 100 ELSE 0 END
                    ) STORED,
  updated_at        TEXT DEFAULT NOW()
);

-- Kabupaten/Kota
CREATE TABLE kabupaten_kota (
  id                  TEXT PRIMARY KEY,
  provinsi_id         TEXT REFERENCES provinsi(id),
  kode_kabupaten_kota TEXT UNIQUE NOT NULL,
  nama_kabupaten_kota TEXT NOT NULL,
  tipe                TEXT NOT NULL CHECK (tipe IN ('KABUPATEN', 'KOTA'))
);

-- Alokasi Kabupaten/Kota
CREATE TABLE alokasi_kabupaten_kota (
  id                  TEXT PRIMARY KEY,
  alokasi_provinsi_id TEXT REFERENCES alokasi_provinsi(id),
  kabupaten_kota_id   TEXT REFERENCES kabupaten_kota(id),
  provinsi_nama       TEXT NOT NULL,
  nominal_alokasi     BIGINT NOT NULL,
  realisasi_total     BIGINT DEFAULT 0,
  selisih             BIGINT GENERATED ALWAYS AS (nominal_alokasi - realisasi_total) STORED,
  persentase_penyerapan NUMERIC GENERATED ALWAYS AS (
                        CASE WHEN nominal_alokasi > 0 THEN (realisasi_total::numeric / nominal_alokasi::numeric) * 100 ELSE 0 END
                      ) STORED,
  updated_at          TEXT DEFAULT NOW()
);
```

### 4.2 Tabel Institusi & Transaksi
```sql
-- Institusi Pendidikan
CREATE TABLE institusi_pendidikan (
  id                    TEXT PRIMARY KEY,
  npsn                  TEXT UNIQUE NOT NULL,
  nama_institusi        TEXT NOT NULL,
  jenjang               TEXT NOT NULL,
  kabupaten_kota_id     TEXT REFERENCES kabupaten_kota(id),
  kabupaten_kota_nama   TEXT NOT NULL,
  provinsi_nama         TEXT NOT NULL,
  status_sekolah        TEXT NOT NULL CHECK (status_sekolah IN ('NEGERI', 'SWASTA')),
  nomor_rekening        TEXT,
  alamat                TEXT,
  nisn                  TEXT,
  nominal_alokasi       BIGINT NOT NULL,
  realisasi_total       BIGINT DEFAULT 0,
  selisih               BIGINT GENERATED ALWAYS AS (nominal_alokasi - realisasi_total) STORED,
  persentase_penyerapan NUMERIC GENERATED ALWAYS AS (
                          CASE WHEN nominal_alokasi > 0 THEN (realisasi_total::numeric / nominal_alokasi::numeric) * 100 ELSE 0 END
                        ) STORED,
  updated_at            TEXT DEFAULT NOW()
);

-- Sumber Dana Institusi
CREATE TABLE sumber_dana_institusi (
  id             TEXT PRIMARY KEY,
  institusi_id   TEXT REFERENCES institusi_pendidikan(id) ON DELETE CASCADE,
  nama_sumber    TEXT NOT NULL,
  tahun_anggaran TEXT NOT NULL,
  nominal        BIGINT NOT NULL,
  realisasi      BIGINT NOT NULL DEFAULT 0,
  saldo_di_bank  BIGINT GENERATED ALWAYS AS (nominal - realisasi) STORED
);

-- Pengeluaran Bulanan Institusi
CREATE TABLE pengeluaran_bulanan_institusi (
  id                  TEXT PRIMARY KEY,
  institusi_id        TEXT REFERENCES institusi_pendidikan(id) ON DELETE CASCADE,
  nomor               INTEGER NOT NULL,
  bulan               TEXT NOT NULL,
  nominal_pengeluaran BIGINT NOT NULL,
  qty                 INTEGER NOT NULL DEFAULT 1,
  sub_total           BIGINT GENERATED ALWAYS AS (nominal_pengeluaran * qty) STORED
);

-- Rincian Pengeluaran Item
CREATE TABLE rincian_pengeluaran_item (
  id               TEXT PRIMARY KEY,
  institusi_id     TEXT REFERENCES institusi_pendidikan(id) ON DELETE CASCADE,
  nomor_bulan      INTEGER NOT NULL,
  nomor            INTEGER NOT NULL,
  nama_produk_jasa TEXT NOT NULL,
  harga_satuan     BIGINT NOT NULL,
  qty              INTEGER NOT NULL DEFAULT 1,
  jumlah           BIGINT GENERATED ALWAYS AS (harga_satuan * qty) STORED
);
```

---

## 5. API Endpoints (Supabase Direct SDK Mapping)

Semua operasi query database tidak lagi melewati backend API perantara Next.js, melainkan langsung menggunakan `@supabase/supabase-js` untuk interaksi yang lebih cepat dan real-time:

- **Tahun Anggaran**: `supabase.from('tahun_anggaran').select('*')`
- **Provinsi**: `supabase.from('alokasi_provinsi').select('*, provinsi:provinsi(*)')`
- **Kabupaten/Kota**: `supabase.from('alokasi_kabupaten_kota').select('*, kabupaten_kota:kabupaten_kota(*)')`
- **Institusi**: `supabase.from('institusi_pendidikan').select('*')`
- **Transaksi**: `supabase.from('pengeluaran_bulanan_institusi').select('*')`

---

## 6. Tech Stack & Frontend Structure

- **Framework**: Next.js 16 (App Router, Client-Side State management)
- **Database Client**: `@supabase/supabase-js`
- **State Management**: Zustand (untuk filter & UI state global)
- **Charts**: Recharts (Responsive bar & area charts)
- **Styling**: Vanilla CSS / globals.css (Modern glassmorphism & responsive grid layout)

---

## 7. System Diagrams

### 7.1 Alur Data (Data Flow Diagram)
```
[Database Supabase] <====== (Direct Select / Update) ======> [Next.js App Components]
                                                                    │
                                                           [Zustand Store] (Global Year)
```

---

## 8. MVP Roadmap — 4 Sprint (8 Minggu)

### 🎯 SPRINT 1: Foundation & Dashboard (Week 1-2)
- **Setup & Database Connection**: Menginstal `@supabase/supabase-js`, menghapus library InsForge, dan membuat instansiasi `lib/supabase.ts`.
- **Dashboard Integration**: Mengubah halaman utama (`app/dashboard/page.tsx`) untuk memuat ringkasan nasional dari tabel `tahun_anggaran` dan `alokasi_provinsi` Supabase.
- **APBN Pertahun**: Mengaktifkan input baru dan pengeditan pagu pusat langsung ke tabel `tahun_anggaran` di Supabase.

### 🎯 SPRINT 2: Provinsi & Kabupaten/Kota (Week 3-4)
- **Provinsi Page**: Menampilkan spreadsheet 38 provinsi dari `alokasi_provinsi` dengan join data `provinsi`. Menyediakan inline editing yang memperbarui data langsung ke database.
- **Kabupaten/Kota Page**: Menampilkan list kabupaten/kota berdasarkan provinsi terpilih. Memungkinkan modifikasi alokasi dan realisasi langsung di grid tabel.

### 🎯 SPRINT 3: Jenjang Pendidikan (Week 5-6)
- **Dynamic Jenjang Route**: Mengarahkan sub-menu sekolah (`/jenjang/[jenjang]`) ke satu berkas yang membaca data tabel `institusi_pendidikan` terfilter berdasarkan kategori jenjang sekolah.
- **Filtering & Search**: Menambahkan filter cascading (Pilih Provinsi → Pilih Kabupaten/Kota) untuk mempersempit pencarian sekolah.
- **Profil Sekolah & Monthly Spend**: Menampilkan dashboard sekolah, saldo rekening dari `sumber_dana_institusi`, dan pengeluaran bulanan.

### 🎯 SPRINT 4: User Management & Polish (Week 7-8)
- **User Manager**: CRUD data user pada tabel `users` dengan enkripsi / validasi di client.
- **Optimasi Query & UI Polish**: Menambahkan indexing pada PostgreSQL Supabase dan menyempurnakan loading spinner & skeleton views di halaman-halaman asinkron.

---

## 9. Success Metrics

- **Performance**: Waktu muat halaman pertama di localhost < 1 detik.
- **UI Responsiveness**: Transisi navigasi instan dan pengeditan sel angka tersimpan secara asinkron dalam waktu < 500ms.
- **Data Accuracy**: Penjumlahan angka pagu di sub-menu terbukti sinkron dengan agregasi total yang ditampilkan di dashboard utama.

---

## 10. Deployment & Verification Plan

### Langkah Instalasi & Uji Coba Lokal
1. Pastikan file `.env.local` berisi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://jpytxmnxbicjmgsgprba.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE
   ```
2. Jalankan `npm install` untuk mengunduh modul `@supabase/supabase-js`.
3. Jalankan `npm run dev` dan buka `http://localhost:3000` untuk memverifikasi fungsionalitas asinkron.
4. Verifikasi seluruh fungsionalitas dengan melakukan editing sel pada halaman APBN dan pastikan perubahan langsung tercermin saat memuat ulang halaman.
