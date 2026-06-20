'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getAlokasiProvinsi, getKabkotaByProvinsi, getJenjangBreakdownByProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi, AlokasiKabupatenKota, JenjangBreakdownProvinsi } from '@/types';
import { ArrowLeft, Banknote, Download, Sparkles } from 'lucide-react';


export default function ProvinsiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { activeTahun } = useAppStore();

  const [provData, setProvData] = useState<AlokasiProvinsi | null>(null);
  const [kabkotaList, setKabkotaList] = useState<AlokasiKabupatenKota[]>([]);
  const [jenjangBreakdown, setJenjangBreakdown] = useState<JenjangBreakdownProvinsi[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: years } = await supabase
        .from('tahun_anggaran')
        .select('id')
        .eq('tahun', activeTahun)
        .single();
      
      if (!years) {
        setLoading(false);
        return;
      }

      const { data: provRow } = await supabase
        .from('alokasi_provinsi')
        .select('*, provinsi:provinsi(*)')
        .eq('provinsi_id', id)
        .eq('tahun_anggaran_id', years.id)
        .single();

      if (!provRow) {
        setProvData(null);
        setLoading(false);
        return;
      }

      setProvData(provRow);

      const { data: kabList } = await supabase
        .from('alokasi_kabupaten_kota')
        .select('*, kabupaten_kota:kabupaten_kota(*)')
        .eq('alokasi_provinsi_id', provRow.id);

      const sortedKabList = kabList ? [...kabList].sort((a, b) => a.kabupaten_kota.nama_kabupaten_kota.localeCompare(b.kabupaten_kota.nama_kabupaten_kota)) : [];
      setKabkotaList(sortedKabList);

      const totalNom = sortedKabList.reduce((sum, item) => sum + Number(item.nominal_alokasi), 0);
      const breakdown = await getJenjangBreakdownByProvinsi(id, totalNom);
      setJenjangBreakdown(breakdown);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, activeTahun]);

  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal_alokasi' | 'realisasi_total' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Calculate dynamic totals based on Kabupaten/Kota state
  const totals = useMemo(() => {
    const nominal = kabkotaList.reduce((sum, item) => sum + item.nominal_alokasi, 0);
    const realisasi = kabkotaList.reduce((sum, item) => sum + item.realisasi_total, 0);
    const selisih = nominal - realisasi;
    const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 0;
    return { nominal, realisasi, selisih, persentase };
  }, [kabkotaList]);

  // Recalculate jenjang breakdown when totals change
  useEffect(() => {
    if (provData) {
      getJenjangBreakdownByProvinsi(id, totals.nominal)
        .then(setJenjangBreakdown)
        .catch(console.error);
    }
  }, [totals.nominal, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!provData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">Wilayah Tidak Ditemukan</h2>
          <p className="text-text-muted mb-6">ID Wilayah: "{id}" tidak terdaftar di sistem.</p>
          <button onClick={() => router.back()} className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Inline editing functions
  const startEdit = (rowId: string, field: 'nominal_alokasi' | 'realisasi_total', currentValue: number) => {
    setEditingCell({ id: rowId, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = async () => {
    if (!editingCell || !provData) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      // 1. Update local state
      setKabkotaList(prev => prev.map(item => {
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

      // 2. Update kabkota in DB
      const { error: kabError } = await supabase
        .from('alokasi_kabupaten_kota')
        .update({ [editingCell.field]: parsed })
        .eq('id', editingCell.id);

      if (kabError) {
        console.error(kabError);
        alert('Gagal menyimpan perubahan ke database.');
        fetchData();
        setEditingCell(null);
        return;
      }

      // 3. Recalculate and update province aggregate in DB
      const newNominal = kabkotaList.reduce((sum, item) => {
        if (item.id === editingCell.id && editingCell.field === 'nominal_alokasi') return sum + parsed;
        return sum + item.nominal_alokasi;
      }, 0);
      const newRealisasi = kabkotaList.reduce((sum, item) => {
        if (item.id === editingCell.id && editingCell.field === 'realisasi_total') return sum + parsed;
        return sum + item.realisasi_total;
      }, 0);

      const { error: provError } = await supabase
        .from('alokasi_provinsi')
        .update({
          nominal_alokasi: newNominal,
          realisasi_total: newRealisasi,
        })
        .eq('id', provData.id);

      if (provError) {
        console.error(provError);
        alert('Gagal memperbarui total provinsi.');
        fetchData();
      }
    }
    setEditingCell(null);
  };

  const handleExportKabkota = () => {
    if (!provData) return;
    const headers = ['No', 'Nama Kabupaten/Kota', 'Alokasi Pagu (Rp)', 'Dana Cair (Rp)', 'Dana Pending (Rp)', 'Persentase Penyaluran (%)'];
    const csvRows = [headers.join(',')];
    kabkotaList.forEach((row, idx) => {
      csvRows.push([
        idx + 1,
        `"${row.kabupaten_kota.nama_kabupaten_kota}"`,
        row.nominal_alokasi,
        row.realisasi_total,
        row.selisih,
        row.persentase_penyerapan.toFixed(2),
      ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Penyaluran_Kabkota_${provData.provinsi.nama_provinsi}_TA_${activeTahun}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEditableCell = (row: AlokasiKabupatenKota, field: 'nominal_alokasi' | 'realisasi_total') => {
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

  return (
    <div className="min-h-screen">
      <Header
        title={`Penyaluran Wilayah: ${provData.provinsi.nama_provinsi}`}
        subtitle={`Tahun Anggaran ${activeTahun} — Status Penyaluran & Pencairan Dana Wilayah`}
      />

      <div className="p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="btn btn-ghost text-sm flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
          
          <button 
            onClick={handleExportKabkota} 
            className="btn btn-secondary text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Ekspor Spreadsheet
          </button>
        </div>

        {/* ============================================================ */}
        {/* 1. SUMMARY CARD / TABLE RINGKASAN */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Summary Penyaluran Dana Provinsi
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
              <Banknote size={16} className="text-indigo-500" />
              Penyaluran per Kategori Sekolah
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Porsi Kategori]</span>
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
              Rincian Penyaluran Dana Area Kabupaten/Kota di Provinsi {provData.provinsi.nama_provinsi}
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Penyaluran Kabupaten/Kota]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Nama Kabupaten/Kota</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Alokasi Pagu</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Cair</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Pending</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>% Penyaluran</th>
                </tr>
              </thead>
              <tbody>
                {kabkotaList.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-semibold text-slate-700">
                      <Link href={`/dashboard/provinsi/${id}/kabkota/${row.kabupaten_kota_id}`} className="hover:text-accent hover:underline transition-colors">
                        {row.kabupaten_kota.nama_kabupaten_kota}
                      </Link>
                    </td>
                    {renderEditableCell(row, 'nominal_alokasi')}
                    {renderEditableCell(row, 'realisasi_total')}
                    <td className="sheet-cell text-right font-mono text-rose-600 bg-rose-50/5">
                      {fmtRupiah(row.selisih)}
                    </td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
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
          <span>Klik langsung pada kolom <strong>Alokasi Pagu</strong> atau <strong>Dana Cair</strong> untuk mengubah data • Tekan <strong>Enter</strong> untuk menyimpan</span>
        </p>
      </div>
    </div>
  );
}
