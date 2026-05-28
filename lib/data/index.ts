// ============================================
// Mock Data — Sistem Transparansi Anggaran Pendidikan
// All data is deterministic (no Math.random) to avoid hydration mismatches
// ============================================
import {
  TahunAnggaran,
  AlokasiProvinsi,
  AlokasiKabupatenKota,
  InstitusiPendidikan,
  User,
  DashboardSummary,
  Jenjang,
} from '@/types';

// Deterministic pseudo-random based on seed
function seededValues(count: number, min: number, max: number, seed: number): number[] {
  const result: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 7) % 2147483647;
    result.push(min + (s / 2147483647) * (max - min));
  }
  return result;
}

// === TAHUN ANGGARAN ===
export const tahunAnggaranData: TahunAnggaran[] = [
  { id: '1', tahun: 2020, total_anggaran: 473_700_000_000_000, status: 'CLOSED', created_at: '2020-01-01' },
  { id: '2', tahun: 2021, total_anggaran: 472_600_000_000_000, status: 'CLOSED', created_at: '2021-01-01' },
  { id: '3', tahun: 2022, total_anggaran: 472_600_000_000_000, status: 'CLOSED', created_at: '2022-01-01' },
  { id: '4', tahun: 2023, total_anggaran: 612_200_000_000_000, status: 'CLOSED', created_at: '2023-01-01' },
  { id: '5', tahun: 2024, total_anggaran: 665_000_000_000_000, status: 'CLOSED', created_at: '2024-01-01' },
  { id: '6', tahun: 2025, total_anggaran: 722_600_000_000_000, status: 'CLOSED', created_at: '2025-01-01' },
  { id: '7', tahun: 2026, total_anggaran: 769_100_000_000_000, status: 'ACTIVE', created_at: '2026-01-01' },
  { id: '8', tahun: 2027, total_anggaran: 0, status: 'DRAFT', created_at: '2026-06-01' },
];

// === 38 PROVINSI ===
const provinsiNames = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi',
  'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kep. Bangka Belitung',
  'Kep. Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta',
  'Jawa Timur', 'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan',
  'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
  'Papua Barat Daya',
];

const nominalDistribution = [
  15.2, 28.5, 14.8, 16.3, 9.2, 19.5, 6.8, 18.2, 5.1, 7.4,
  35.0, 55.8, 48.2, 12.5, 52.0, 22.5, 9.8, 12.3, 14.5, 11.2,
  8.5, 10.1, 14.8, 5.2, 9.8, 10.5, 25.5, 9.8, 4.2, 5.8,
  7.2, 5.5, 18.5, 8.2, 6.8, 7.5, 5.8, 4.8,
];

const realisasiPct = [
  64.5, 72.3, 68.1, 71.2, 65.8, 69.4, 62.3, 73.5, 78.2, 75.6,
  88.5, 74.1, 69.2, 82.4, 81.5, 70.8, 79.5, 66.3, 58.2, 62.8,
  64.5, 68.9, 73.2, 59.8, 71.5, 63.8, 72.4, 61.2, 68.5, 58.9,
  55.3, 52.8, 48.2, 51.2, 45.8, 42.5, 38.9, 43.8,
];

export const alokasiProvinsiData: AlokasiProvinsi[] = provinsiNames.map((nama, i) => {
  const nominal = nominalDistribution[i] * 1_000_000_000_000;
  const realisasi = Math.round(nominal * (realisasiPct[i] / 100));
  return {
    id: `prov-${i + 1}`,
    tahun_anggaran_id: '7',
    provinsi_id: `p-${i + 1}`,
    provinsi: { id: `p-${i + 1}`, kode_provinsi: `${11 + i}`, nama_provinsi: nama },
    nominal_alokasi: nominal,
    realisasi_total: realisasi,
    selisih: nominal - realisasi,
    persentase_penyerapan: realisasiPct[i],
    updated_at: '2026-04-15',
  };
});

// === KABUPATEN/KOTA ===
const kabkotaJabar = [
  { nama: 'Kabupaten Bogor', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Sukabumi', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Cianjur', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Bandung', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Garut', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Tasikmalaya', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Ciamis', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Kuningan', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Cirebon', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Majalengka', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Sumedang', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Indramayu', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Subang', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Purwakarta', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Karawang', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Bekasi', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Bandung Barat', tipe: 'KABUPATEN' as const },
  { nama: 'Kabupaten Pangandaran', tipe: 'KABUPATEN' as const },
  { nama: 'Kota Bogor', tipe: 'KOTA' as const },
  { nama: 'Kota Sukabumi', tipe: 'KOTA' as const },
  { nama: 'Kota Bandung', tipe: 'KOTA' as const },
  { nama: 'Kota Cirebon', tipe: 'KOTA' as const },
  { nama: 'Kota Bekasi', tipe: 'KOTA' as const },
  { nama: 'Kota Depok', tipe: 'KOTA' as const },
  { nama: 'Kota Cimahi', tipe: 'KOTA' as const },
  { nama: 'Kota Tasikmalaya', tipe: 'KOTA' as const },
  { nama: 'Kota Banjar', tipe: 'KOTA' as const },
];

// Real kabupaten/kota names per province
type KT = { nama: string; tipe: 'KABUPATEN' | 'KOTA' };
const K = (n: string): KT => ({ nama: `Kab. ${n}`, tipe: 'KABUPATEN' });
const C = (n: string): KT => ({ nama: `Kota ${n}`, tipe: 'KOTA' });

const kabkotaPerProvinsi: KT[][] = [
  /* Aceh */        [K('Aceh Besar'),K('Aceh Utara'),K('Aceh Timur'),K('Aceh Barat'),K('Pidie'),C('Banda Aceh'),C('Lhokseumawe')],
  /* Sumut */       [K('Deli Serdang'),K('Langkat'),K('Simalungun'),K('Karo'),K('Asahan'),K('Labuhanbatu'),C('Medan'),C('Pematangsiantar'),C('Binjai')],
  /* Sumbar */      [K('Agam'),K('Tanah Datar'),K('Pesisir Selatan'),K('Solok'),K('Limapuluh Kota'),C('Padang'),C('Bukittinggi'),C('Payakumbuh')],
  /* Riau */        [K('Kampar'),K('Bengkalis'),K('Indragiri Hilir'),K('Rokan Hulu'),K('Siak'),C('Pekanbaru'),C('Dumai')],
  /* Jambi */       [K('Muaro Jambi'),K('Batanghari'),K('Tebo'),K('Bungo'),K('Merangin'),C('Jambi'),C('Sungai Penuh')],
  /* Sumsel */      [K('Ogan Komering Ulu'),K('Musi Banyuasin'),K('Banyuasin'),K('Muara Enim'),K('Lahat'),C('Palembang'),C('Prabumulih'),C('Lubuklinggau')],
  /* Bengkulu */    [K('Rejang Lebong'),K('Bengkulu Utara'),K('Seluma'),K('Kaur'),C('Bengkulu')],
  /* Lampung */     [K('Lampung Tengah'),K('Lampung Selatan'),K('Lampung Timur'),K('Tanggamus'),K('Way Kanan'),C('Bandar Lampung'),C('Metro')],
  /* Babel */       [K('Bangka'),K('Belitung'),K('Bangka Barat'),K('Bangka Selatan'),C('Pangkalpinang')],
  /* Kepri */       [K('Bintan'),K('Karimun'),K('Natuna'),K('Lingga'),C('Batam'),C('Tanjungpinang')],
  /* DKI */         [C('Jakarta Pusat'),C('Jakarta Utara'),C('Jakarta Barat'),C('Jakarta Selatan'),C('Jakarta Timur'),K('Kep. Seribu')],
  /* Jabar - already defined separately */ kabkotaJabar,
  /* Jateng */      [K('Cilacap'),K('Banyumas'),K('Kebumen'),K('Purworejo'),K('Magelang'),K('Semarang'),K('Demak'),K('Kudus'),C('Semarang'),C('Surakarta'),C('Magelang'),C('Salatiga')],
  /* DIY */         [K('Sleman'),K('Bantul'),K('Gunungkidul'),K('Kulon Progo'),C('Yogyakarta')],
  /* Jatim */       [K('Sidoarjo'),K('Gresik'),K('Malang'),K('Jember'),K('Banyuwangi'),K('Kediri'),K('Mojokerto'),K('Lamongan'),K('Pasuruan'),C('Surabaya'),C('Malang'),C('Kediri'),C('Batu')],
  /* Banten */      [K('Tangerang'),K('Serang'),K('Pandeglang'),K('Lebak'),C('Tangerang'),C('Cilegon'),C('Serang'),C('Tangerang Selatan')],
  /* Bali */        [K('Badung'),K('Gianyar'),K('Tabanan'),K('Klungkung'),K('Buleleng'),K('Karangasem'),C('Denpasar')],
  /* NTB */         [K('Lombok Barat'),K('Lombok Tengah'),K('Lombok Timur'),K('Sumbawa'),K('Dompu'),C('Mataram'),C('Bima')],
  /* NTT */         [K('Kupang'),K('Timor Tengah Selatan'),K('Sikka'),K('Ende'),K('Manggarai'),K('Flores Timur'),C('Kupang')],
  /* Kalbar */      [K('Pontianak'),K('Sambas'),K('Ketapang'),K('Sintang'),K('Sanggau'),C('Pontianak'),C('Singkawang')],
  /* Kalteng */     [K('Kotawaringin Barat'),K('Kotawaringin Timur'),K('Kapuas'),K('Barito Selatan'),K('Murung Raya'),C('Palangka Raya')],
  /* Kalsel */      [K('Banjar'),K('Tanah Laut'),K('Hulu Sungai Selatan'),K('Tabalong'),K('Barito Kuala'),C('Banjarmasin'),C('Banjarbaru')],
  /* Kaltim */      [K('Kutai Kartanegara'),K('Berau'),K('Paser'),K('Kutai Barat'),K('Penajam Paser Utara'),C('Samarinda'),C('Balikpapan'),C('Bontang')],
  /* Kaltara */     [K('Bulungan'),K('Malinau'),K('Nunukan'),K('Tana Tidung'),C('Tarakan')],
  /* Sulut */       [K('Minahasa'),K('Bolaang Mongondow'),K('Minahasa Selatan'),K('Sangihe'),C('Manado'),C('Bitung'),C('Tomohon')],
  /* Sulteng */     [K('Donggala'),K('Poso'),K('Toli-Toli'),K('Banggai'),K('Morowali'),C('Palu')],
  /* Sulsel */      [K('Gowa'),K('Bone'),K('Wajo'),K('Maros'),K('Bulukumba'),K('Luwu'),K('Pangkep'),C('Makassar'),C('Parepare'),C('Palopo')],
  /* Sultra */      [K('Konawe'),K('Muna'),K('Buton'),K('Kolaka'),K('Konawe Selatan'),C('Kendari'),C('Baubau')],
  /* Gorontalo */   [K('Gorontalo'),K('Boalemo'),K('Pohuwato'),K('Bone Bolango'),C('Gorontalo')],
  /* Sulbar */      [K('Mamuju'),K('Majene'),K('Polewali Mandar'),K('Mamasa'),C('Mamuju')],
  /* Maluku */      [K('Maluku Tengah'),K('Maluku Tenggara'),K('Buru'),K('Seram Bagian Barat'),K('Kepulauan Aru'),C('Ambon'),C('Tual')],
  /* Malut */       [K('Halmahera Utara'),K('Halmahera Selatan'),K('Halmahera Tengah'),K('Kepulauan Sula'),C('Ternate'),C('Tidore Kepulauan')],
  /* Papua */       [K('Jayapura'),K('Merauke'),K('Nabire'),K('Mimika'),K('Keerom'),C('Jayapura')],
  /* Papua Barat */ [K('Manokwari'),K('Fak-Fak'),K('Sorong'),K('Raja Ampat'),C('Sorong')],
  /* Papua Sel */   [K('Merauke'),K('Boven Digoel'),K('Mappi'),K('Asmat'),C('Merauke')],
  /* Papua Teng */  [K('Nabire'),K('Paniai'),K('Mimika'),K('Puncak Jaya'),C('Nabire')],
  /* Papua Peg */   [K('Jayawijaya'),K('Yahukimo'),K('Pegunungan Bintang'),K('Lanny Jaya'),C('Wamena')],
  /* Papua BD */    [K('Teluk Bintuni'),K('Sorong Selatan'),K('Maybrat'),K('Tambrauw'),C('Sorong')],
];

// Deterministic percentage values for kabkota
const kabkotaPctSeeds = seededValues(600, 42, 92, 42);

export function getKabkotaByProvinsi(provinsiId: string): AlokasiKabupatenKota[] {
  const provIdx = parseInt(provinsiId.replace('p-', ''), 10) - 1;
  const templates = kabkotaPerProvinsi[provIdx] || [];
  const provData = alokasiProvinsiData.find(p => p.provinsi_id === provinsiId);
  if (!provData) return [];
  const totalNominal = provData.nominal_alokasi;

  // Deterministic share values
  const shareVals = seededValues(templates.length, 0.7, 1.3, provIdx * 100 + 7);

  return templates.map((kab, i) => {
    const share = shareVals[i] / templates.length;
    const nominal = Math.round(totalNominal * share);
    const pct = kabkotaPctSeeds[(provIdx * 15 + i) % kabkotaPctSeeds.length];
    const realisasi = Math.round(nominal * pct / 100);
    return {
      id: `kab-${provinsiId}-${i}`,
      alokasi_provinsi_id: provData.id,
      kabupaten_kota_id: `k-${provinsiId}-${i}`,
      kabupaten_kota: {
        id: `k-${provinsiId}-${i}`,
        provinsi_id: provinsiId,
        kode_kabupaten_kota: `${provinsiId.replace('p-', '')}.${String(i + 1).padStart(2, '0')}`,
        nama_kabupaten_kota: kab.nama,
        tipe: kab.tipe,
      },
      provinsi_nama: provData.provinsi.nama_provinsi,
      nominal_alokasi: nominal,
      realisasi_total: realisasi,
      selisih: nominal - realisasi,
      persentase_penyerapan: Math.round(pct * 10) / 10,
      updated_at: '2026-04-15',
    };
  });
}

export function getAllKabkota(): AlokasiKabupatenKota[] {
  return alokasiProvinsiData.flatMap(p => getKabkotaByProvinsi(p.provinsi_id));
}

// === INSTITUSI PENDIDIKAN ===
const universitas = [
  'Universitas Indonesia', 'Institut Teknologi Bandung', 'Universitas Gadjah Mada',
  'Institut Pertanian Bogor', 'Universitas Airlangga', 'Universitas Diponegoro',
  'Universitas Padjadjaran', 'Universitas Brawijaya', 'Universitas Hasanuddin',
  'Universitas Sumatera Utara', 'Universitas Andalas', 'Universitas Riau',
  'Universitas Lampung', 'Universitas Sriwijaya', 'Universitas Jember',
  'Universitas Sebelas Maret', 'Universitas Negeri Yogyakarta', 'Universitas Negeri Malang',
  'Universitas Negeri Semarang', 'Universitas Negeri Surabaya',
];

const smaNames = [
  'SMAN 1 Jakarta', 'SMAN 3 Bandung', 'SMAN 1 Yogyakarta', 'SMAN 5 Surabaya',
  'SMAN 1 Denpasar', 'SMAN 1 Semarang', 'SMAN 2 Jakarta', 'SMAN 1 Malang',
  'SMAN 1 Medan', 'SMAN 1 Makassar', 'SMAN 8 Jakarta', 'SMAN 1 Bogor',
  'SMAN 1 Padang', 'SMAN 1 Palembang', 'SMAN 1 Bekasi',
];

const smpNames = [
  'SMPN 1 Jakarta', 'SMPN 1 Bandung', 'SMPN 1 Surabaya', 'SMPN 1 Yogyakarta',
  'SMPN 1 Semarang', 'SMPN 1 Malang', 'SMPN 1 Denpasar', 'SMPN 1 Medan',
  'SMPN 2 Jakarta', 'SMPN 1 Makassar', 'SMPN 1 Bogor', 'SMPN 1 Bekasi',
  'SMPN 1 Depok', 'SMPN 1 Tangerang', 'SMPN 1 Palembang',
];

const sdNames = [
  'SDN 01 Menteng', 'SDN 02 Bendungan Hilir', 'SDN 01 Cikini', 'SDN 01 Bandung',
  'SDN 01 Surabaya', 'SDN 01 Yogyakarta', 'SDN 01 Semarang', 'SDN 01 Malang',
  'SDN 01 Denpasar', 'SDN 01 Medan', 'SDN 01 Makassar', 'SDN 01 Padang',
  'SDN 01 Palembang', 'SDN 01 Bogor', 'SDN 01 Bekasi',
];

const paudNames = [
  'PAUD Al-Ikhlas Jakarta', 'PAUD Tunas Bangsa Bandung', 'PAUD Ceria Surabaya',
  'PAUD Harapan Yogyakarta', 'PAUD Bintang Semarang', 'PAUD Melati Malang',
  'PAUD Pelangi Denpasar', 'PAUD Kasih Medan', 'PAUD Mandiri Makassar',
  'PAUD Anggrek Padang', 'PAUD Mawar Palembang', 'PAUD Dahlia Bogor',
];

// Deterministic share values for institution nominal
const instNominalFactors = seededValues(30, 0.6, 1.4, 999);
const instPctValues = seededValues(30, 42, 95, 777);

function generateInstitusi(names: string[], jenjang: Jenjang, baseNominal: number): InstitusiPendidikan[] {
  const kabkotaList = getKabkotaByProvinsi('p-12'); // Jawa Barat as default
  return names.map((nama, i) => {
    const nominal = baseNominal * instNominalFactors[i % instNominalFactors.length];
    const pct = instPctValues[i % instPctValues.length];
    const realisasi = Math.round(nominal * pct / 100);
    const kab = kabkotaList[i % kabkotaList.length];
    return {
      id: `inst-${jenjang.toLowerCase()}-${i}`,
      npsn: `${jenjang === 'UNIVERSITAS' ? '3' : jenjang === 'SMA' ? '2' : jenjang === 'SMP' ? '1' : jenjang === 'SD' ? '0' : '9'}${String(1000 + i)}`,
      nama_institusi: nama,
      jenjang,
      kabupaten_kota_id: kab?.kabupaten_kota?.id || 'k-p-12-0',
      kabupaten_kota_nama: kab?.kabupaten_kota?.nama_kabupaten_kota || 'Kabupaten Bogor',
      provinsi_nama: 'Jawa Barat',
      status_sekolah: (i % 3 === 0 || nama.includes('Al-Ikhlas') || nama.includes('Bina') || nama.includes('Pelita')) ? 'SWASTA' : 'NEGERI',
      nominal_alokasi: Math.round(nominal),
      realisasi_total: realisasi,
      selisih: Math.round(nominal) - realisasi,
      persentase_penyerapan: Math.round(pct * 10) / 10,
      updated_at: '2026-04-15',
    };
  });
}

export function getInstitusiByJenjang(jenjang: Jenjang): InstitusiPendidikan[] {
  switch (jenjang) {
    case 'UNIVERSITAS': return generateInstitusi(universitas, 'UNIVERSITAS', 2_000_000_000_000);
    case 'SMA': return generateInstitusi(smaNames, 'SMA', 800_000_000_000);
    case 'SMP': return generateInstitusi(smpNames, 'SMP', 750_000_000_000);
    case 'SD': return generateInstitusi(sdNames, 'SD', 700_000_000_000);
    case 'PAUD': return generateInstitusi(paudNames, 'PAUD', 300_000_000_000);
    default: return [];
  }
}

// === USERS ===
export const usersData: User[] = [
  { id: 'u1', username: 'superadmin', email: 'admin@kemdikbud.go.id', role: 'SUPER_ADMIN', is_active: true, created_at: '2024-01-01' },
  { id: 'u2', username: 'ahmad.fauzi', email: 'a.fauzi@kemdikbud.go.id', role: 'ADMIN', is_active: true, created_at: '2024-02-15' },
  { id: 'u3', username: 'sari.dewi', email: 's.dewi@jabar.go.id', role: 'ADMIN_PROVINSI', provinsi_id: 'p-12', is_active: true, created_at: '2024-03-10' },
  { id: 'u4', username: 'budi.santoso', email: 'b.santoso@bandung.go.id', role: 'ADMIN_KABKOTA', kabupaten_kota_id: 'k-p-12-3', is_active: true, created_at: '2024-04-20' },
  { id: 'u5', username: 'viewer.nasional', email: 'viewer@kemdikbud.go.id', role: 'VIEWER', is_active: true, created_at: '2024-05-01' },
  { id: 'u6', username: 'auditor.bpk', email: 'audit@bpk.go.id', role: 'AUDITOR', is_active: true, created_at: '2024-06-01' },
  { id: 'u7', username: 'rina.wulan', email: 'r.wulan@jatim.go.id', role: 'ADMIN_PROVINSI', provinsi_id: 'p-15', is_active: true, created_at: '2024-07-01' },
  { id: 'u8', username: 'doni.pratama', email: 'd.pratama@kemdikbud.go.id', role: 'ADMIN', is_active: false, created_at: '2024-01-15' },
];

// === DASHBOARD SUMMARY ===
// Pre-computed realisasi values for trend (deterministic)
const trendRealisasiPct = [68.2, 70.5, 72.1, 65.8, 71.3, 73.8, 67.5];

export function getDashboardSummary(): DashboardSummary {
  const totalNominal = alokasiProvinsiData.reduce((s, p) => s + p.nominal_alokasi, 0);
  const totalRealisasi = alokasiProvinsiData.reduce((s, p) => s + p.realisasi_total, 0);

  const jenjangData: Record<Jenjang, { nominal: number; realisasi: number }> = {
    UNIVERSITAS: { nominal: 150_000_000_000_000, realisasi: 98_000_000_000_000 },
    SMA: { nominal: 200_000_000_000_000, realisasi: 130_000_000_000_000 },
    SMP: { nominal: 180_000_000_000_000, realisasi: 118_000_000_000_000 },
    SD: { nominal: 200_000_000_000_000, realisasi: 126_000_000_000_000 },
    PAUD: { nominal: 39_100_000_000_000, realisasi: 28_400_000_000_000 },
  };

  const activeYears = tahunAnggaranData.filter(t => t.status !== 'DRAFT');

  return {
    total_nominal: totalNominal,
    total_realisasi: totalRealisasi,
    persentase_penyerapan: totalNominal > 0 ? (totalRealisasi / totalNominal) * 100 : 0,
    per_jenjang: (Object.keys(jenjangData) as Jenjang[]).map(j => ({
      jenjang: j,
      nominal: jenjangData[j].nominal,
      realisasi: jenjangData[j].realisasi,
      persentase: jenjangData[j].nominal > 0 ? (jenjangData[j].realisasi / jenjangData[j].nominal) * 100 : 0,
    })),
    tren_tahunan: activeYears.map((t, i) => ({
      tahun: t.tahun,
      nominal: t.total_anggaran,
      realisasi: Math.round(t.total_anggaran * (trendRealisasiPct[i] || 70) / 100),
    })),
  };
}
