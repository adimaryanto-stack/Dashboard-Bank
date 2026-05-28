// ============================================
// Types — Sistem Transparansi Anggaran Pendidikan
// ============================================

export type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type Jenjang = 'UNIVERSITAS' | 'SMA' | 'SMP' | 'SD' | 'PAUD';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ADMIN_PROVINSI' | 'ADMIN_KABKOTA' | 'VIEWER' | 'AUDITOR';

export interface TahunAnggaran {
  id: string;
  tahun: number;
  total_anggaran: number;
  status: BudgetStatus;
  created_at: string;
}

export interface Provinsi {
  id: string;
  kode_provinsi: string;
  nama_provinsi: string;
}

export interface AlokasiProvinsi {
  id: string;
  tahun_anggaran_id: string;
  provinsi_id: string;
  provinsi: Provinsi;
  nominal_alokasi: number;
  realisasi_total: number;
  selisih: number;
  persentase_penyerapan: number;
  updated_at: string;
}

export interface KabupatenKota {
  id: string;
  provinsi_id: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  tipe: 'KABUPATEN' | 'KOTA';
}

export interface AlokasiKabupatenKota {
  id: string;
  alokasi_provinsi_id: string;
  kabupaten_kota_id: string;
  kabupaten_kota: KabupatenKota;
  provinsi_nama: string;
  nominal_alokasi: number;
  realisasi_total: number;
  selisih: number;
  persentase_penyerapan: number;
  updated_at: string;
}

export interface InstitusiPendidikan {
  id: string;
  npsn: string;
  nama_institusi: string;
  jenjang: Jenjang;
  kabupaten_kota_id: string;
  kabupaten_kota_nama: string;
  provinsi_nama: string;
  status_sekolah: 'NEGERI' | 'SWASTA';
  nominal_alokasi: number;
  realisasi_total: number;
  selisih: number;
  persentase_penyerapan: number;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  provinsi_id?: string;
  kabupaten_kota_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_nominal: number;
  total_realisasi: number;
  persentase_penyerapan: number;
  per_jenjang: JenjangSummary[];
  tren_tahunan: TrenTahunan[];
}

export interface JenjangSummary {
  jenjang: Jenjang;
  nominal: number;
  realisasi: number;
  persentase: number;
}

export interface TrenTahunan {
  tahun: number;
  nominal: number;
  realisasi: number;
}
