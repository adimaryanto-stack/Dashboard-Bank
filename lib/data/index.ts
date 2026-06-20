import { supabase } from '../supabase';
import {
  TahunAnggaran,
  AlokasiProvinsi,
  AlokasiKabupatenKota,
  InstitusiPendidikan,
  User,
  DashboardSummary,
  Jenjang,
  SumberDanaInstitusi,
  PengeluaranBulananInstitusi,
  ProfilInstitusi,
  RincianPengeluaranItem,
  RincianPengeluaranBulanan,
  JenjangBreakdownProvinsi,
} from '@/types';

// ============================================
// Fallback Helper Functions (Deterministic Seeded Values)
// ============================================
function seededValues(count: number, min: number, max: number, seed: number): number[] {
  const result: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 7) % 2147483647;
    result.push(min + (s / 2147483647) * (max - min));
  }
  return result;
}

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

const targetTotal2026 = 769_100_000_000_000;
const originalTotal2026 = 583_500_000_000_000;

const originalTotalReal = nominalDistribution.reduce((sum, val, idx) => {
  return sum + val * 1_000_000_000_000 * (realisasiPct[idx] / 100);
}, 0);
const targetTotalReal = Math.round(originalTotalReal * (targetTotal2026 / originalTotal2026));

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
  /* Jabar */       kabkotaJabar,
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

const kabkotaPctSeeds = seededValues(600, 42, 92, 42);
const instNominalFactors = seededValues(30, 0.6, 1.4, 999);
const instPctValues = seededValues(30, 42, 95, 777);

const trendRealisasiPct = [62.4, 68.5, 72.1, 74.5, 78.2, 81.3, 65.1];

const bulanNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const produkJasaUniv = [
  { nama: 'Biaya Penelitian Dosen', hargaBase: 45_000_000, qtyBase: 3 },
  { nama: 'Pemeliharaan Laboratorium', hargaBase: 125_000_000, qtyBase: 1 },
  { nama: 'Langganan Jurnal Ilmiah Scopus', hargaBase: 85_000_000, qtyBase: 1 },
  { nama: 'Beasiswa Mahasiswa Berprestasi', hargaBase: 12_000_000, qtyBase: 15 },
  { nama: 'Gaji Dosen Luar Biasa', hargaBase: 4_500_000, qtyBase: 12 },
];

const produkJasaSMA = [
  { nama: 'Buku Pelajaran Kurikulum Merdeka', hargaBase: 120_000, qtyBase: 250 },
  { nama: 'Alat Tulis & Sarana Kantor', hargaBase: 15_000_000, qtyBase: 1 },
  { nama: 'Pembayaran Listrik & Internet', hargaBase: 3_500_000, qtyBase: 3 },
  { nama: 'Honor Pendidik Ekskul', hargaBase: 750_000, qtyBase: 8 },
  { nama: 'Pemeliharaan Ruang Kelas', hargaBase: 25_000_000, qtyBase: 1 },
];

const produkJasaSD = [
  { nama: 'Buku Paket Tematik', hargaBase: 45_000, qtyBase: 400 },
  { nama: 'Alat Peraga Edukatif', hargaBase: 8_500_000, qtyBase: 1 },
  { nama: 'Konsumsi Rapat Guru', hargaBase: 35_000, qtyBase: 50 },
  { nama: 'Penyediaan Sanitasi & Sabun', hargaBase: 2_500_000, qtyBase: 1 },
  { nama: 'Honor Guru Non-PNS', hargaBase: 1_500_000, qtyBase: 3 },
];

function getProdukJasaTemplate(jenjang: Jenjang) {
  switch (jenjang) {
    case 'UNIVERSITAS': return produkJasaUniv;
    case 'SMA': case 'SMP': return produkJasaSMA;
    case 'SD': case 'PAUD': return produkJasaSD;
    default: return produkJasaSMA;
  }
}

// ============================================
// Core Database APIs (Direct Supabase)
// ============================================

export async function getTahunAnggaran(): Promise<TahunAnggaran[]> {
  const { data, error } = await supabase
    .from('tahun_anggaran')
    .select('*')
    .order('tahun', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateTahunAnggaranData(newData: TahunAnggaran[]) {
  const { data: dbYears } = await supabase.from('tahun_anggaran').select('id');
  const dbIds = dbYears?.map(y => y.id) || [];
  const newIds = newData.map(y => y.id);
  const deletedIds = dbIds.filter(id => !newIds.includes(id));

  if (deletedIds.length > 0) {
    await supabase.from('tahun_anggaran').delete().in('id', deletedIds);
  }

  const { error } = await supabase.from('tahun_anggaran').upsert(newData);
  if (error) throw error;
}

export async function getAlokasiProvinsi(tahun: number): Promise<AlokasiProvinsi[]> {
  const { data: yearRow } = await supabase
    .from('tahun_anggaran')
    .select('id')
    .eq('tahun', tahun)
    .single();
  if (!yearRow) return [];

  const { data, error } = await supabase
    .from('alokasi_provinsi')
    .select('*, provinsi:provinsi(*)')
    .eq('tahun_anggaran_id', yearRow.id);
  
  if (error) throw error;
  return data || [];
}

export async function getKabkotaByProvinsi(
  provinsiId: string,
  tahun: number = 2026
): Promise<AlokasiKabupatenKota[]> {
  const { data: yearRow } = await supabase
    .from('tahun_anggaran')
    .select('id')
    .eq('tahun', tahun)
    .single();
  if (!yearRow) return [];

  const { data: provAlloc } = await supabase
    .from('alokasi_provinsi')
    .select('id')
    .eq('provinsi_id', provinsiId)
    .eq('tahun_anggaran_id', yearRow.id)
    .single();
  if (!provAlloc) return [];

  const { data, error } = await supabase
    .from('alokasi_kabupaten_kota')
    .select('*, kabupaten_kota:kabupaten_kota(*)')
    .eq('alokasi_provinsi_id', provAlloc.id);
  
  if (error) throw error;
  return data || [];
}

export async function getAllKabkota(tahun: number = 2026): Promise<AlokasiKabupatenKota[]> {
  const { data: yearRow } = await supabase
    .from('tahun_anggaran')
    .select('id')
    .eq('tahun', tahun)
    .single();
  if (!yearRow) return [];

  const { data: provAllocs } = await supabase
    .from('alokasi_provinsi')
    .select('id')
    .eq('tahun_anggaran_id', yearRow.id);
  
  if (!provAllocs || provAllocs.length === 0) return [];
  const provAllocIds = provAllocs.map(p => p.id);

  const { data, error } = await supabase
    .from('alokasi_kabupaten_kota')
    .select('*, kabupaten_kota:kabupaten_kota(*)')
    .in('alokasi_provinsi_id', provAllocIds);
  
  if (error) throw error;
  return data || [];
}

export async function getInstitusiByJenjang(jenjang: Jenjang): Promise<InstitusiPendidikan[]> {
  const { data, error } = await supabase
    .from('institusi_pendidikan')
    .select('*')
    .eq('jenjang', jenjang);
  if (error) throw error;
  return data || [];
}

export async function getUsersData(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDashboardSummary(tahun: number = 2026): Promise<DashboardSummary> {
  const { data: yearRow } = await supabase
    .from('tahun_anggaran')
    .select('*')
    .eq('tahun', tahun)
    .single();
  
  const totalNominal = yearRow ? Number(yearRow.total_anggaran) : 0;

  let totalRealisasi = 0;
  if (yearRow) {
    const { data: provAllocs } = await supabase
      .from('alokasi_provinsi')
      .select('realisasi_total')
      .eq('tahun_anggaran_id', yearRow.id);
    
    totalRealisasi = provAllocs?.reduce((sum, p) => sum + Number(p.realisasi_total || 0), 0) || 0;
  }

  const { data: schools } = await supabase
    .from('institusi_pendidikan')
    .select('jenjang, nominal_alokasi, realisasi_total');
  
  const jenjangSummaryMap: Record<Jenjang, { nominal: number; realisasi: number }> = {
    UNIVERSITAS: { nominal: 0, realisasi: 0 },
    SMA: { nominal: 0, realisasi: 0 },
    SMP: { nominal: 0, realisasi: 0 },
    SD: { nominal: 0, realisasi: 0 },
    PAUD: { nominal: 0, realisasi: 0 },
  };

  schools?.forEach(s => {
    const key = s.jenjang.toUpperCase() as Jenjang;
    if (jenjangSummaryMap[key]) {
      jenjangSummaryMap[key].nominal += Number(s.nominal_alokasi);
      jenjangSummaryMap[key].realisasi += Number(s.realisasi_total);
    }
  });

  const per_jenjang = (Object.keys(jenjangSummaryMap) as Jenjang[]).map(j => ({
    jenjang: j,
    nominal: jenjangSummaryMap[j].nominal,
    realisasi: jenjangSummaryMap[j].realisasi,
    persentase: jenjangSummaryMap[j].nominal > 0 ? (jenjangSummaryMap[j].realisasi / jenjangSummaryMap[j].nominal) * 100 : 0,
  }));

  const { data: activeYears } = await supabase
    .from('tahun_anggaran')
    .select('*')
    .neq('status', 'DRAFT')
    .order('tahun', { ascending: true });
  
  const tren_tahunan = await Promise.all(
    (activeYears || []).map(async (y) => {
      const { data: provs } = await supabase
        .from('alokasi_provinsi')
        .select('realisasi_total')
        .eq('tahun_anggaran_id', y.id);
      
      const real = provs?.reduce((sum, p) => sum + Number(p.realisasi_total || 0), 0) || 0;
      return {
        tahun: y.tahun,
        nominal: Number(y.total_anggaran),
        realisasi: real,
      };
    })
  );

  return {
    total_nominal: totalNominal,
    total_realisasi: totalRealisasi,
    persentase_penyerapan: totalNominal > 0 ? (totalRealisasi / totalNominal) * 100 : 0,
    per_jenjang,
    tren_tahunan,
  };
}

export async function getProfilInstitusi(
  id: string,
  tahun: number = 2026
): Promise<ProfilInstitusi | null> {
  const { data: school, error: schoolErr } = await supabase
    .from('institusi_pendidikan')
    .select('*')
    .eq('id', id)
    .single();
  
  if (schoolErr || !school) return null;

  const { data: sumberDana } = await supabase
    .from('sumber_dana_institusi')
    .select('*')
    .eq('institusi_id', id)
    .eq('tahun_anggaran', String(tahun));

  const { data: monthlySpend } = await supabase
    .from('pengeluaran_bulanan_institusi')
    .select('*')
    .eq('institusi_id', id)
    .order('nomor', { ascending: true });

  const totalMonthlySpend = monthlySpend?.reduce((sum, m) => sum + Number(m.sub_total || 0), 0) || 0;

  return {
    institusi: school,
    sumber_dana: sumberDana || [],
    pengeluaran_bulanan: monthlySpend || [],
    saldo_surplus_defisit: Number(school.realisasi_total) - totalMonthlySpend,
  };
}

export async function getAllInstitusi(): Promise<InstitusiPendidikan[]> {
  const { data, error } = await supabase
    .from('institusi_pendidikan')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function getRincianPengeluaranBulanan(
  institusiId: string,
  nomorBulan: number,
  tahun: number = 2026
): Promise<RincianPengeluaranBulanan | null> {
  const { data: school } = await supabase
    .from('institusi_pendidikan')
    .select('id, nama_institusi')
    .eq('id', institusiId)
    .single();
  
  if (!school) return null;

  const { data: monthlySpend } = await supabase
    .from('pengeluaran_bulanan_institusi')
    .select('*')
    .eq('institusi_id', institusiId)
    .eq('nomor', nomorBulan)
    .single();

  const totalSpend = monthlySpend ? Number(monthlySpend.nominal_pengeluaran) : 0;

  const { data: items } = await supabase
    .from('rincian_pengeluaran_item')
    .select('*')
    .eq('institusi_id', institusiId)
    .eq('nomor_bulan', nomorBulan);

  const subTotal = Math.round(totalSpend / 1.11);
  const pajakNominal = totalSpend - subTotal;

  return {
    institusi_id: school.id,
    institusi_nama: school.nama_institusi,
    bulan: bulanNames[nomorBulan - 1] || 'Januari',
    nomor_bulan: nomorBulan,
    items: items || [],
    sub_total: subTotal,
    pajak_persen: 11,
    pajak_nominal: pajakNominal,
    total: totalSpend,
  };
}

// ============================================
// Regional Breakdowns with Fallback to Mock Data
// ============================================

export async function getJenjangBreakdownByKabkota(
  kabkotaId: string,
  nominalAlokasi: number
): Promise<JenjangBreakdownProvinsi[]> {
  const { data: schools, error } = await supabase
    .from('institusi_pendidikan')
    .select('jenjang, nominal_alokasi')
    .eq('kabupaten_kota_id', kabkotaId);
  
  if (error) throw error;

  // Fallback to deterministic mock generator if no schools in DB under this kabkota
  if (!schools || schools.length === 0) {
    const match = kabkotaId.match(/kab-p-(\d+)-(\d+)/);
    const provIdx = match ? parseInt(match[1], 10) : 1;
    const kabIdx = match ? parseInt(match[2], 10) : 0;
    const seed = provIdx * 31 + kabIdx + 3;

    let pUniv = 10;
    let pSMA = 20;
    let pSMK = 15;
    let pSMP = 20;
    let pSD = 30;
    let pPAUD = 5;

    const cUniv = (seed * 3) % 4;
    if (cUniv === 0) {
      pSD += pUniv;
      pUniv = 0;
    }
    const cSMA = 3 + ((seed * 7) % 15);
    const cSMK = 2 + ((seed * 5) % 10);
    const cSMP = 6 + ((seed * 11) % 25);
    const cSD = 15 + ((seed * 17) % 80);
    const cPAUD = 10 + ((seed * 23) % 60);

    const jenjangs = [
      { label: 'Universitas (Strata 1)', porsi: pUniv, count: cUniv },
      { label: 'Sekolah Menengah Atas (SMA)', porsi: pSMA, count: cSMA },
      { label: 'Sekolah Menengah Kejuruan (SMK)', porsi: pSMK, count: cSMK },
      { label: 'Sekolah Menengah Pertama (SMP)', porsi: pSMP, count: cSMP },
      { label: 'Sekolah Dasar (SD)', porsi: pSD, count: cSD },
      { label: 'Pendidikan Anak Usia Dini (PAUD)', porsi: pPAUD, count: cPAUD },
    ];

    return jenjangs.map((j, i) => {
      const nominal = Math.round(nominalAlokasi * j.porsi / 100);
      return {
        nomor: i + 1,
        jenjang: j.label,
        jumlah_sekolah: j.count,
        nominal_keseluruhan: nominal,
        porsi_anggaran: j.porsi,
      };
    });
  }

  const counts: Record<string, { count: number; nominal: number }> = {
    'UNIVERSITAS': { count: 0, nominal: 0 },
    'SMA': { count: 0, nominal: 0 },
    'SMP': { count: 0, nominal: 0 },
    'SD': { count: 0, nominal: 0 },
    'PAUD': { count: 0, nominal: 0 },
  };

  schools.forEach(s => {
    const key = s.jenjang.toUpperCase();
    if (counts[key]) {
      counts[key].count++;
      counts[key].nominal += Number(s.nominal_alokasi);
    }
  });

  const jenjangs = [
    { label: 'Universitas (Strata 1)', key: 'UNIVERSITAS' },
    { label: 'Sekolah Menengah Atas (SMA)', key: 'SMA' },
    { label: 'Sekolah Menengah Kejuruan (SMK)', key: 'SMA' }, // merged or custom
    { label: 'Sekolah Menengah Pertama (SMP)', key: 'SMP' },
    { label: 'Sekolah Dasar (SD)', key: 'SD' },
    { label: 'Pendidikan Anak Usia Dini (PAUD)', key: 'PAUD' },
  ];

  return jenjangs.map((j, i) => {
    const nominal = counts[j.key].nominal;
    const porsi = nominalAlokasi > 0 ? (nominal / nominalAlokasi) * 100 : 0;
    return {
      nomor: i + 1,
      jenjang: j.label,
      jumlah_sekolah: counts[j.key].count,
      nominal_keseluruhan: nominal,
      porsi_anggaran: porsi,
    };
  });
}

export async function getInstitusiByKabkota(
  kabkotaId: string,
  namaKabkota: string,
  provinsiNama: string,
  totalNominal: number
): Promise<InstitusiPendidikan[]> {
  const { data: schools, error } = await supabase
    .from('institusi_pendidikan')
    .select('*')
    .eq('kabupaten_kota_id', kabkotaId);
  
  if (error) throw error;

  // Fallback to deterministic mock generator if no schools in DB
  if (!schools || schools.length === 0) {
    const match = kabkotaId.match(/kab-p-(\d+)-(\d+)/);
    const provIdx = match ? parseInt(match[1], 10) : 1;
    const kabIdx = match ? parseInt(match[2], 10) : 0;
    const seed = provIdx * 31 + kabIdx + 3;

    let pUniv = 10;
    let pSMA = 20;
    let pSMK = 15;
    let pSMP = 20;
    let pSD = 30;
    let pPAUD = 5;

    const cUniv = (seed * 3) % 4;
    if (cUniv === 0) {
      pSD += pUniv;
      pUniv = 0;
    }
    const cSMA = 3 + ((seed * 7) % 15);
    const cSMK = 2 + ((seed * 5) % 10);
    const cSMP = 6 + ((seed * 11) % 25);
    const cSD = 15 + ((seed * 17) % 80);
    const cPAUD = 10 + ((seed * 23) % 60);

    const cleanKabName = namaKabkota.replace('Kab. ', '').replace('Kota ', '');

    const jenjangConfigs = [
      { key: 'UNIVERSITAS' as const, porsi: pUniv, count: cUniv, prefix: 'Universitas', baseNominal: 50_000_000_000 },
      { key: 'SMA' as const, porsi: pSMA, count: cSMA, prefix: 'SMAN', baseNominal: 5_000_000_000 },
      { key: 'SMP' as const, porsi: pSMP, count: cSMP, prefix: 'SMPN', baseNominal: 3_000_000_000 },
      { key: 'SD' as const, porsi: pSD, count: cSD, prefix: 'SDN', baseNominal: 1_500_000_000 },
      { key: 'PAUD' as const, porsi: pPAUD, count: cPAUD, prefix: 'PAUD', baseNominal: 500_000_000 },
      { key: 'SMA' as const, porsi: pSMK, count: cSMK, prefix: 'SMKN', baseNominal: 4_500_000_000, label: 'SMK' },
    ];

    const list: InstitusiPendidikan[] = [];
    let schoolCounter = 1;

    jenjangConfigs.forEach((jc) => {
      if (jc.count === 0) return;
      const jenjangBudget = Math.round(totalNominal * jc.porsi / 100);
      let distributedSum = 0;

      for (let i = 0; i < jc.count; i++) {
        const schoolSeed = seed + schoolCounter * 7;
        const variation = 0.8 + ((schoolSeed * 97) % 5) * 0.1;
        
        let schoolNominal = 0;
        if (i === jc.count - 1) {
          schoolNominal = jenjangBudget - distributedSum;
        } else {
          schoolNominal = Math.round((jenjangBudget / jc.count) * variation);
          distributedSum += schoolNominal;
        }

        const realisasiPct = 60 + ((schoolSeed * 53) % 36);
        const realisasi = Math.round(schoolNominal * realisasiPct / 100);
        const isSwasta = (schoolSeed % 5 === 0 && jc.key !== 'UNIVERSITAS');
        const status_sekolah = isSwasta ? ('SWASTA' as const) : ('NEGERI' as const);

        let schoolName = '';
        if (jc.key === 'UNIVERSITAS') {
          const univTypes = ['Universitas', 'IAIN', 'STIE', 'Politeknik'];
          const type = univTypes[i % univTypes.length];
          schoolName = `${type} ${cleanKabName} ${i > 0 ? String.fromCharCode(65 + i) : ''}`;
        } else {
          const levelLabel = jc.label || jc.key;
          schoolName = isSwasta 
            ? `${levelLabel} Swasta Bina Bangsa ${cleanKabName}` 
            : `${jc.prefix} ${i + 1} ${cleanKabName}`;
        }

        list.push({
          id: `inst-${kabkotaId}-${schoolCounter}`,
          npsn: `${jc.key === 'UNIVERSITAS' ? '3' : jc.key === 'SMA' ? '2' : jc.key === 'SMP' ? '1' : jc.key === 'SD' ? '0' : '9'}${String(2000 + schoolCounter)}`,
          nama_institusi: schoolName,
          jenjang: jc.label === 'SMK' ? 'SMA' : jc.key,
          kabupaten_kota_id: kabkotaId,
          kabupaten_kota_nama: namaKabkota,
          provinsi_nama: provinsiNama,
          status_sekolah,
          nomor_rekening: `100.${200 + schoolCounter}.${300 + schoolCounter * 3}.000`,
          nominal_alokasi: schoolNominal,
          realisasi_total: realisasi,
          selisih: schoolNominal - realisasi,
          persentase_penyerapan: Math.round((realisasi / schoolNominal) * 1000) / 10,
          updated_at: '2026-04-15',
        });

        schoolCounter++;
      }
    });

    return list;
  }

  return schools;
}

export async function getJenjangBreakdownByProvinsi(
  provinsiId: string,
  nominalAlokasi: number
): Promise<JenjangBreakdownProvinsi[]> {
  const { data: provRow } = await supabase
    .from('provinsi')
    .select('nama_provinsi')
    .eq('id', provinsiId)
    .single();
  
  if (!provRow) return [];

  const { data: schools } = await supabase
    .from('institusi_pendidikan')
    .select('jenjang, nominal_alokasi')
    .eq('provinsi_nama', provRow.nama_provinsi);

  // Fallback to deterministic mock generator if no schools in DB
  if (!schools || schools.length === 0) {
    const provIdx = parseInt(provinsiId.replace('p-', ''), 10) - 1;
    const seed = isNaN(provIdx) ? 1 : provIdx + 1;

    const jenjangs = [
      { label: 'Universitas (Strata 1)', porsi: 5, baseCount: 15, countMod: 50, countMul: 11 },
      { label: 'Sekolah Menengah Atas (SMA)', porsi: 15, baseCount: 150, countMod: 400, countMul: 43 },
      { label: 'Sekolah Menengah Kejuruan (SMK)', porsi: 10, baseCount: 100, countMod: 300, countMul: 29 },
      { label: 'Sekolah Menengah Pertama (SMP)', porsi: 25, baseCount: 400, countMod: 1000, countMul: 83 },
      { label: 'Sekolah Dasar (SD)', porsi: 40, baseCount: 1000, countMod: 2500, countMul: 113 },
      { label: 'Pendidikan Anak Usia Dini (PAUD)', porsi: 5, baseCount: 1200, countMod: 3500, countMul: 157 },
    ];

    return jenjangs.map((j, i) => {
      const count = j.baseCount + ((seed * j.countMul) % j.countMod);
      const nominal = Math.round(nominalAlokasi * j.porsi / 100);
      return {
        nomor: i + 1,
        jenjang: j.label,
        jumlah_sekolah: count,
        nominal_keseluruhan: nominal,
        porsi_anggaran: j.porsi,
      };
    });
  }

  const counts: Record<string, { count: number; nominal: number }> = {
    'UNIVERSITAS': { count: 0, nominal: 0 },
    'SMA': { count: 0, nominal: 0 },
    'SMP': { count: 0, nominal: 0 },
    'SD': { count: 0, nominal: 0 },
    'PAUD': { count: 0, nominal: 0 },
  };

  schools.forEach(s => {
    const key = s.jenjang.toUpperCase();
    if (counts[key]) {
      counts[key].count++;
      counts[key].nominal += Number(s.nominal_alokasi);
    }
  });

  const jenjangs = [
    { label: 'Universitas (Strata 1)', key: 'UNIVERSITAS', porsi: 5 },
    { label: 'Sekolah Menengah Atas (SMA)', key: 'SMA', porsi: 15 },
    { label: 'Sekolah Menengah Kejuruan (SMK)', key: 'SMA', porsi: 10 },
    { label: 'Sekolah Menengah Pertama (SMP)', key: 'SMP', porsi: 25 },
    { label: 'Sekolah Dasar (SD)', key: 'SD', porsi: 40 },
    { label: 'Pendidikan Anak Usia Dini (PAUD)', key: 'PAUD', porsi: 5 },
  ];

  return jenjangs.map((j, i) => {
    const nominal = counts[j.key].nominal;
    const porsi = nominalAlokasi > 0 ? (nominal / nominalAlokasi) * 100 : j.porsi;
    return {
      nomor: i + 1,
      jenjang: j.label,
      jumlah_sekolah: counts[j.key].count,
      nominal_keseluruhan: nominal,
      porsi_anggaran: porsi,
    };
  });
}
