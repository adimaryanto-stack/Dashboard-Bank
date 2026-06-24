# PRD — Dashboard Bank

**Version:** 1.5.0 (Supabase-Integrated Production Ready)  
**Date:** 24 Juni 2026  
**Status:** ✅ APPROVED FOR PRODUCTION  
**Project Type:** Web-Based Spreadsheet Dashboard — Education Budget Disbursement (Bank Penyalur)  
**Database Backend:** Supabase Direct (PostgreSQL SDK)

---

## DAFTAR ISI

1. [Project Overview](#1-project-overview)
2. [Menu Structure](#2-menu-structure)
3. [Fitur per Menu](#3-fitur-per-menu)
4. [Database Schema](#4-database-schema)
5. [API Endpoints (Supabase Direct SDK)](#5-api-endpoints-supabase-direct-sdk)
6. [Tech Stack & Frontend Structure](#6-tech-stack--frontend-structure)
7. [System Diagrams](#7-system-diagrams)
8. [MVP Roadmap — 5 Sprint (10 Minggu)](#8-mvp-roadmap--5-sprint-10-minggu)
9. [Success Metrics](#9-success-metrics)
10. [Deployment & Verification Plan](#10-deployment--verification-plan)

---

## 1. Project Overview

### 1.1 Deskripsi Aplikasi
Dashboard Bank adalah aplikasi web berbasis **spreadsheet interface** untuk menampilkan, mengelola, dan mengaudit aliran dana pendidikan Indonesia dari tingkat nasional (APBN) hingga pencairan ke rekening sekolah di seluruh daerah melalui Bank Penyalur. Tampilannya menyerupai Excel/Google Sheets dengan semua kalkulasi angka terhubung secara real-time ke database Supabase.

### 1.2 Target User & Role

| Role | Akses | Keterangan |
|------|-------|------------|
| `SUPER_ADMIN` | Full access | Semua menu, termasuk User Manager |
| `ADMIN` | Create, Read, Update | Semua menu data pagu pusat & regional |
| `ADMIN_PROVINSI` | CRUD untuk provinsinya | Terbatas pada wilayah provinsi (Regional) |
| `ADMIN_KABKOTA` | CRUD untuk kabkotanya | Terbatas pada wilayah kabkota (Area) |
| `VIEWER` | Read-only | Semua menu, tidak bisa edit |
| `AUDITOR` | Read-only + Export | Semua menu, fokus audit trail perbankan |

### 1.3 Core Concept: Spreadsheet-Like Interface & Banking Operations
- **Tampilan seperti Excel** — table rows & columns, sticky header & footer.
- **Inline Editing** — klik sel angka langsung edit, tekan Enter/Tab untuk simpan langsung ke Supabase.
- **Kalkulasi Real-Time** — `Selisih = Nominal − Realisasi`, `% = (Realisasi / Nominal) × 100`.
- **Conditional Formatting** — badge warna: 🟢 ≥80%, 🟡 50–79%, 🔴 <50%.
- **Direct Supabase Integration** — Mengambil dan memperbarui data secara langsung ke Supabase client-side / server-side.
- **Ekspor CSV** — mengunduh data dalam format CSV untuk keperluan pelaporan dan audit bank.

---

## 2. Menu Structure

```
📊 Dashboard (Main)
   └── Ringkasan penyaluran nasional: Pagu Pusat, Dana Cair, % Penyaluran + Chart

💰 Kelola Pagu Pusat (APBN)
   └── Kelola tahun anggaran: DRAFT → ACTIVE → CLOSED

📍 Penyaluran Wilayah (Provinsi)
   └── Spreadsheet 38 provinsi, inline editing, modal tambah provinsi

🏛️ Penyaluran Area (Kabupaten / Kota)
   └── Filter per provinsi, inline editing

🎓 Kategori Sekolah (Jenjang Pendidikan)
   ├── Universitas
   ├── SMA
   ├── SMP
   ├── SD
   └── PAUD

🏫 Rekening Sekolah (Profil Institusi)
   └── Detail rekening, histori transfer triwulan, rincian pengeluaran sekolah

👥 Manajer Pengguna
   └── CRUD users + role assignment dari database Supabase
```

---

## 3. Fitur per Menu

### 3.1 Dashboard
- 3 metric card: Total Pagu Pusat, Total Dana Cair, % Penyaluran Sukses.
- Tabel ringkasan per jenjang dengan progress bar.
- Bar chart Pagu Pusat vs Dana Cair per kategori sekolah (Recharts).
- Line/Area chart tren penyaluran dana 2020–2026 (Recharts).
- Dropdown tahun anggaran (header kanan atas, global).
- Auto-refresh saat data di menu lain berubah.

### 3.2 Kelola Pagu Pusat
- Menambah tahun anggaran baru (status awal DRAFT).
- Mengaktifkan tahun anggaran (hanya boleh ada 1 tahun yang ACTIVE).
- Menutup tahun anggaran (status CLOSED, data dikunci menjadi read-only).
- Mengedit pagu pusat untuk status DRAFT atau ACTIVE.

### 3.3 Penyaluran Wilayah (Provinsi)
- Spreadsheet 38 provinsi di Indonesia.
- Edit langsung pagu alokasi dan realisasi pada baris provinsi.
- Tombol "Tambah Provinsi" untuk mendaftarkan wilayah baru lengkap dengan pagu alokasi.
- Auto-save saat blur/Enter dengan validasi tipe data.
- Ekspor data provinsi ke CSV.

### 3.4 Penyaluran Area (Kabupaten / Kota)
- Dropdown Provinsi di bagian atas untuk memfilter data kabupaten/kota.
- Spreadsheet kabupaten/kota di provinsi terpilih.
- Edit nominal alokasi dan realisasi per kabupaten/kota dengan auto-save ke database.

### 3.5 Kategori Sekolah (Sub-Menus)
- Terdapat 5 sub-menu: Universitas, SMA, SMP, SD, PAUD.
- Menampilkan data sekolah dengan NPSN, Nama Sekolah, Alokasi Pagu, Dana Cair, Selisih, dan % Penyaluran.
- Pencarian berdasarkan Nama Sekolah atau NPSN.
- Filter bertingkat berdasarkan Provinsi dan Kabupaten/Kota.
- Pagination untuk menangani jumlah data sekolah yang besar.

### 3.6 Rekening Sekolah (Profil Institusi)
- Menampilkan data detail sekolah, nomor rekening, alamat, dan status sekolah.
- Visualisasi alokasi per sumber dana dan pengeluaran bulanan.
- Alokasi pencairan per triwulan (Quarterly Disbursements - Q1, Q2, Q3, Q4) dengan status transfer sukses.
- Rincian pengeluaran item per bulan untuk audit transaksi.

### 3.7 Manajer Pengguna
- CRUD data user lengkap dengan role assignment dan status aktif/nonaktif akun.

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
  nominal_alokasi       BIGINT NOT NULL,
  realisasi_total       BIGINT DEFAULT 0,
  selisih               BIGINT GENERATED ALWAYS AS (nominal_alokasi - realisasi_total) STORED,
  persentase_penyerapan NUMERIC GENERATED ALWAYS AS (
                          CASE WHEN nominal_alokasi > 0 THEN (realisasi_total::numeric / nominal_alokasi::numeric) * 100 ELSE 0 END
                        ) STORED,
  updated_at            TEXT DEFAULT NOW()
);
```

---

## 5. API Endpoints (Supabase Direct SDK)

Semua query database dilakukan client-side menggunakan SDK resmi `@supabase/supabase-js`:
- **Tahun Anggaran**: `supabase.from('tahun_anggaran').select('*')`
- **Provinsi**: `supabase.from('alokasi_provinsi').select('*, provinsi:provinsi(*)')`
- **Kabupaten/Kota**: `supabase.from('alokasi_kabupaten_kota').select('*, kabupaten_kota:kabupaten_kota(*)')`
- **Institusi**: `supabase.from('institusi_pendidikan').select('*')`
- **User Manager**: `supabase.from('users').select('*')`

---

## 6. Tech Stack & Frontend Structure

- **Framework**: Next.js 16 (App Router)
- **Database Client**: `@supabase/supabase-js` (Supabase Client Direct Connection)
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Vanilla CSS (globals.css Tailwind variables `@theme`)

---

## 7. System Diagrams

### 7.1 Alur Data (Data Flow Diagram)
```
[Database Supabase] <====== (Direct Select / Update) ======> [Next.js App Components]
                                                                    │
                                                           [Zustand Store] (Global Year)
```

---

## 8. MVP Roadmap — 5 Sprint (10 Minggu)

### 🎯 SPRINT 1: Setup & UI Foundation (Week 1-2)
- **Setup & Database Connection**: Menginstal `@supabase/supabase-js` dan inisialisasi client.
- **Global Layout & Themes**: Pembuatan tata letak global (Sidebar, Header, Shell) dengan style modern glassmorphism.

### 🎯 SPRINT 2: Dashboard & APBN (Week 3-4)
- **Dashboard Integration**: Integrasi metrik dan charts (Recharts) dengan data Supabase.
- **Kelola Pagu Pusat**: CRUD tahun anggaran dengan status (`DRAFT`, `ACTIVE`, `CLOSED`).

### 🎯 SPRINT 3: Spreadsheet Provinsi & Kabkota (Week 5-6)
- **Penyaluran Wilayah (Provinsi)**: Spreadsheet 38 provinsi dengan inline editing dan fitur tambah provinsi baru.
- **Penyaluran Area (Kabkota)**: Spreadsheet kabupaten/kota dengan filter cascading per provinsi.

### 🎯 SPRINT 4: Rekening Sekolah & Penyaluran Triwulan (Week 7-8)
- **Kategori Sekolah (Jenjang)**: Halaman sub-menu sekolah berjenjang dengan pagination dan pencarian.
- **Rekening Sekolah**: Detail profil sekolah, transfer triwulan (Q1-Q4), dan rincian pengeluaran bulanan.

### 🎯 SPRINT 5: Manajer Pengguna & RBAC (Week 9-10)
- **Manajer Pengguna**: CRUD data user pada tabel `users`.
- **Role-Based Access Control (RBAC)**: Pembatasan aksi edit berdasarkan role pengguna.

---

## 9. Success Metrics

- **Performance**: Waktu muat halaman pertama di localhost < 1 detik.
- **UI Responsiveness**: Transisi navigasi instan dan pengeditan sel angka tersimpan secara asinkron dalam waktu < 500ms.
- **Data Consistency**: Penjumlahan angka pagu di sub-menu sinkron dengan agregasi total di dashboard utama.

---

## 10. Deployment & Verification Plan

### Langkah Instalasi & Uji Coba Lokal
1. Pastikan file `.env.local` berisi url dan anon key Supabase.
2. Jalankan `npm install` untuk mengunduh dependencies.
3. Jalankan `npm run dev` pada port 3003.
4. Verifikasi fungsionalitas CRUD user, tambah provinsi, dan inline editing spreadsheet.
