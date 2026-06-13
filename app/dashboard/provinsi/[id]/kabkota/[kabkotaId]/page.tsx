'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, getKabkotaByProvinsi, getJenjangBreakdownByKabkota, getInstitusiByKabkota, tahunAnggaranData } from '@/lib/data';
import { fmtRupiah } from '@/lib/utils/formatters';
import { AlokasiKabupatenKota, InstitusiPendidikan } from '@/types';
import { ArrowLeft, Banknote, Download, School, Sparkles } from 'lucide-react';

export default function KabkotaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // provinsi_id e.g. p-1
  const kabkotaId = params.kabkotaId as string; // kabupaten_kota_id e.g. k-p-1-0
  const { activeTahun } = useAppStore();

  // Find target province & kabkota data scaled dynamically
  const provData = useMemo(() => {
    const baseData = alokasiProvinsiData.find(p => p.provinsi_id === id);
    if (!baseData) return null;
    
    const targetTahun = tahunAnggaranData.find(t => t.tahun === activeTahun) || tahunAnggaranData[6];
    const baseTahun = tahunAnggaranData[6];
    const scale = targetTahun.total_anggaran > 0 ? targetTahun.total_anggaran / baseTahun.total_anggaran : 1.0;
    const seed = (activeTahun % 7) || 1;
    const shift = 0.95 + (seed * 0.012);

    const nominal = Math.round(baseData.nominal_alokasi * scale);
    const realisasi = Math.min(nominal, Math.round(baseData.realisasi_total * scale * shift));

    return {
      ...baseData,
      nominal_alokasi: nominal,
      realisasi_total: realisasi,
      selisih: nominal - realisasi,
      persentase_penyerapan: nominal > 0 ? (realisasi / nominal) * 100 : 0,
    };
  }, [id, activeTahun]);

  const kabkotaData = useMemo(() => {
    const baseData = getKabkotaByProvinsi(id).find(k => k.kabupaten_kota_id === kabkotaId);
    if (!baseData) return null;
    
    const targetTahun = tahunAnggaranData.find(t => t.tahun === activeTahun) || tahunAnggaranData[6];
    const baseTahun = tahunAnggaranData[6];
    const scale = targetTahun.total_anggaran > 0 ? targetTahun.total_anggaran / baseTahun.total_anggaran : 1.0;
    const seed = (activeTahun % 7) || 1;
    const shift = 0.95 + (seed * 0.012);

    const nominal = Math.round(baseData.nominal_alokasi * scale);
    const realisasi = Math.min(nominal, Math.round(baseData.realisasi_total * scale * shift));

    return {
      ...baseData,
      nominal_alokasi: nominal,
      realisasi_total: realisasi,
      selisih: nominal - realisasi,
      persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
    };
  }, [id, kabkotaId, activeTahun]);

  const scaledSchoolList = useMemo(() => {
    if (!kabkotaData || !provData) return [];
    return getInstitusiByKabkota(
      kabkotaId,
      kabkotaData.kabupaten_kota.nama_kabupaten_kota,
      provData.provinsi.nama_provinsi,
      kabkotaData.nominal_alokasi
    );
  }, [kabkotaId, kabkotaData, provData]);

  // States
  const [schoolList, setSchoolList] = useState<InstitusiPendidikan[]>(scaledSchoolList);

  useEffect(() => {
    setSchoolList(scaledSchoolList);
  }, [scaledSchoolList]);
  
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal_alokasi' | 'realisasi_total' } | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!provData || !kabkotaData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">Area Tidak Ditemukan</h2>
          <p className="text-text-muted mb-6">Data Wilayah / Kabupaten tidak terdaftar di sistem.</p>
          <button onClick={() => router.back()} className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic totals based on individual school edits
  const totals = useMemo(() => {
    const nominal = schoolList.reduce((sum, item) => sum + item.nominal_alokasi, 0);
    const realisasi = schoolList.reduce((sum, item) => sum + item.realisasi_total, 0);
    const selisih = nominal - realisasi;
    const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 0;
    return { nominal, realisasi, selisih, persentase };
  }, [schoolList]);

  // Jenjang Breakdown calculation (linked to dynamic district school list total budget)
  const jenjangBreakdown = useMemo(() => {
    return getJenjangBreakdownByKabkota(kabkotaId, totals.nominal);
  }, [kabkotaId, totals.nominal]);

  // Inline editing functions
  const startEdit = (rowId: string, field: 'nominal_alokasi' | 'realisasi_total', currentValue: number) => {
    setEditingCell({ id: rowId, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setSchoolList(prev => prev.map(item => {
        if (item.id !== editingCell.id) return item;
        const nominal = editingCell.field === 'nominal_alokasi' ? parsed : item.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi_total' ? parsed : item.realisasi_total;
        return {
          ...item,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
        };
      }));
    }
    setEditingCell(null);
  };

  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal_alokasi' | 'realisasi_total') => {
    const value = row[field];
    const isEditing = editingCell?.id === row.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <td className="sheet-cell sheet-cell-editing text-right">
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm pr-1"
          />
        </td>
      );
    }

    return (
      <td
        className="sheet-cell sheet-cell-editable text-right font-mono cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => startEdit(row.id, field, value)}
      >
        {fmtRupiah(value)}
      </td>
    );
  };

  // Status Pencairan display helper
  const getPencairanStatusBadge = (pct: number) => {
    if (pct >= 100) {
      return <span className="badge bg-emerald-100 text-emerald-700 border-emerald-300">🟢 Sudah Masuk</span>;
    }
    if (pct > 0) {
      return <span className="badge bg-amber-100 text-amber-700 border-amber-300">🟡 Proses ({pct}%)</span>;
    }
    return <span className="badge bg-rose-100 text-rose-700 border-rose-300">🔴 Belum Masuk</span>;
  };

  return (
    <div className="min-h-screen">
      <Header
        title={`Penyaluran Area: ${kabkotaData.kabupaten_kota.nama_kabupaten_kota}`}
        subtitle={`Provinsi ${provData.provinsi.nama_provinsi} — Status Pencairan Rekening Sekolah Tahun ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/dashboard/provinsi" className="hover:text-accent hover:underline">Penyaluran Wilayah</Link>
            <span>➔</span>
            <Link href={`/dashboard/provinsi/${id}`} className="hover:text-accent hover:underline">{provData.provinsi.nama_provinsi}</Link>
            <span>➔</span>
            <span className="font-semibold text-slate-700">{kabkotaData.kabupaten_kota.nama_kabupaten_kota}</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn btn-ghost text-sm flex items-center gap-2">
              <ArrowLeft size={16} />
              Kembali
            </button>
            
            <button 
              onClick={() => {
                alert('Fungsi ekspor Google Sheets berhasil disimulasikan! Menghasilkan berkas Excel...');
              }} 
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Ekspor Spreadsheet
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. SUMMARY CARD / TABLE RINGKASAN */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Summary Penyaluran Dana Area
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Summary]</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-center" style={{ width: 160 }}>Tahun Anggaran</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Alokasi Pagu</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Dana Cair</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Dana Pending</th>
                  <th className="sheet-header-cell text-center" style={{ width: 200 }}>Rasio Penyaluran</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sheet-cell text-center font-bold text-text-muted">1</td>
                  <td className="sheet-cell text-center font-medium">{activeTahun}</td>
                  <td className="sheet-cell text-right font-mono font-bold text-text-primary">
                    {fmtRupiah(totals.nominal)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-emerald-600 bg-emerald-50/30">
                    {fmtRupiah(totals.realisasi)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-rose-600 bg-rose-50/30">
                    {fmtRupiah(totals.selisih)}
                  </td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={totals.persentase} size="md" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. KATEGORI SEKOLAH TABLE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <School size={16} className="text-indigo-500" />
              Porsi Penyaluran per Kategori Sekolah
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Proporsi Kategori]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Kategori Penerima</th>
                  <th className="sheet-header-cell text-right" style={{ width: 180 }}>Jumlah Sekolah</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 240 }}>Pagu Alokasi</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Porsi Dana (%)</th>
                </tr>
              </thead>
              <tbody>
                {jenjangBreakdown.map((row) => {
                  let label = row.jenjang;
                  if (row.jenjang.includes('Universitas')) label = 'Universitas';
                  else if (row.jenjang.includes('Sekolah Menengah Atas')) label = 'SMA / SMK';
                  else if (row.jenjang.includes('Sekolah Menengah Pertama')) label = 'SMP';
                  else if (row.jenjang.includes('Sekolah Dasar')) label = 'SD';
                  else if (row.jenjang.includes('Anak Usia Dini')) label = 'PAUD';
                  
                  return (
                    <tr key={row.nomor} className="hover:bg-indigo-50/50 transition">
                      <td className="sheet-cell text-center text-text-muted text-xs">{row.nomor}</td>
                      <td className="sheet-cell text-left font-semibold text-slate-700">{label}</td>
                      <td className="sheet-cell text-right font-mono text-text-primary font-medium">{row.jumlah_sekolah}</td>
                      <td className="sheet-cell text-right font-mono font-medium text-indigo-700 bg-indigo-50/10">
                        {fmtRupiah(row.nominal_keseluruhan)}
                      </td>
                      <td className="sheet-cell text-center">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                          {row.porsi_anggaran}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. KABUPATEN/KOTA DETAIL TABLE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Status Pencairan Dana ke Rekening Sekolah di {kabkotaData.kabupaten_kota.nama_kabupaten_kota}
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Rekening Penerima]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Nama Sekolah / Rekening Penerima</th>
                  <th className="sheet-header-cell text-center" style={{ width: 140 }}>Layanan</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Alokasi Pagu (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Cair (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Pending (Rp)</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Status Pencairan</th>
                </tr>
              </thead>
              <tbody>
                {schoolList.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-semibold text-slate-700">
                      <Link href={`/dashboard/profil-institusi/${row.id}`} className="hover:text-accent hover:underline transition-colors text-indigo-700">
                        {row.nama_institusi}
                      </Link>
                    </td>
                    <td className="sheet-cell text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.status_sekolah === 'NEGERI' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {row.status_sekolah === 'NEGERI' ? 'Konvensional' : 'Syariah'}
                      </span>
                    </td>
                    {renderEditableCell(row, 'nominal_alokasi')}
                    {renderEditableCell(row, 'realisasi_total')}
                    <td className="sheet-cell text-right font-mono text-rose-600 bg-rose-50/5">
                      {fmtRupiah(row.selisih)}
                    </td>
                    <td className="sheet-cell text-center">
                      {getPencairanStatusBadge(row.persentase_penyerapan)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Realisasi Anggaran Row (Identical to Google Sheets Screenshot) */}
                <tr className="border-t-2 border-slate-300">
                  <td className="sheet-cell font-bold text-center bg-emerald-100 text-emerald-800 border-r border-slate-200" colSpan={3}>
                    Realisasi Dana Cair
                  </td>
                  <td className="sheet-cell text-right font-bold bg-emerald-500 text-white font-mono border-r border-slate-200 text-sm">
                    {fmtRupiah(totals.realisasi)}
                  </td>
                  <td className="sheet-cell text-right font-bold bg-amber-400 text-slate-900 font-mono border-r border-slate-200 text-sm">
                    {fmtRupiah(totals.selisih)}
                  </td>
                  <td className="sheet-cell text-center font-bold bg-emerald-500 text-white font-mono text-sm">
                    {totals.persentase.toFixed(2).replace('.', ',')}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-text-muted flex items-center gap-1">
          <span>✏️</span>
          <span>Klik langsung pada kolom <strong>Alokasi Pagu</strong> atau <strong>Dana Cair</strong> untuk mengubah data transfer • Tekan <strong>Enter</strong> untuk menyimpan</span>
        </p>
      </div>
    </div>
  );
}
