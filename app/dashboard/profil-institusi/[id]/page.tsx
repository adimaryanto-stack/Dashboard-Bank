'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { getProfilInstitusi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { SumberDanaInstitusi, PengeluaranBulananInstitusi, ProfilInstitusi } from '@/types';
import { ArrowLeft, Banknote, CreditCard, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';

export default function ProfilInstitusiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { activeTahun } = useAppStore();

  const [profilData, setProfilData] = useState<ProfilInstitusi | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable state
  const [sumberDana, setSumberDana] = useState<SumberDanaInstitusi[]>([]);
  const [pengeluaran, setPengeluaran] = useState<PengeluaranBulananInstitusi[]>([]);
  const [nomorRekening, setNomorRekening] = useState('');
  const [editingRekening, setEditingRekening] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProfilInstitusi(id, activeTahun);
      setProfilData(res);
      if (res) {
        setSumberDana(res.sumber_dana);
        setPengeluaran(res.pengeluaran_bulanan);
        setNomorRekening(res.institusi.nomor_rekening || '');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, activeTahun]);

  // Sumber Dana editing
  const [editingSD, setEditingSD] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editSDValue, setEditSDValue] = useState('');

  // Pengeluaran editing
  const [editingPB, setEditingPB] = useState<{ id: string; field: 'nominal_pengeluaran' | 'qty' } | null>(null);
  const [editPBValue, setEditPBValue] = useState('');

  const commitRekening = async () => {
    setEditingRekening(false);
    const { error } = await supabase
      .from('institusi_pendidikan')
      .update({ nomor_rekening: nomorRekening })
      .eq('id', id);
    if (error) {
      console.error(error);
      alert('Gagal menyimpan nomor rekening ke database.');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Detail Rekening Sekolah"
          subtitle="Memuat data profil keuangan & mutasi rekening..."
        />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!profilData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Sekolah tidak ditemukan</h2>
          <p className="text-text-muted mb-4">ID: {id}</p>
          <button onClick={() => router.back()} className="btn btn-primary">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const { institusi } = profilData;

  // ===== Calculated totals =====
  const totalNominalSumber = sumberDana.reduce((s, d) => s + d.nominal, 0);
  const totalRealisasiSumber = sumberDana.reduce((s, d) => s + d.realisasi, 0);
  const totalSaldoDiBank = sumberDana.reduce((s, d) => s + d.saldo_di_bank, 0);
  const saldoSurplusDefisit = totalNominalSumber - totalRealisasiSumber;
  const totalPengeluaran = pengeluaran.reduce((s, p) => s + p.sub_total, 0);

  // ===== Sumber Dana Editing =====
  const startEditSD = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    setEditingSD({ id, field });
    setEditSDValue(String(value));
  };

  const commitEditSD = async () => {
    if (!editingSD) return;
    const parsed = Number(editSDValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setSumberDana(prev => prev.map(item => {
        if (item.id !== editingSD.id) return item;
        const nominal = editingSD.field === 'nominal' ? parsed : item.nominal;
        const realisasi = editingSD.field === 'realisasi' ? parsed : item.realisasi;
        return { ...item, nominal, realisasi, saldo_di_bank: nominal - realisasi };
      }));

      const targetItem = sumberDana.find(s => s.id === editingSD.id);
      if (targetItem) {
        const nominal = editingSD.field === 'nominal' ? parsed : targetItem.nominal;
        const realisasi = editingSD.field === 'realisasi' ? parsed : targetItem.realisasi;
        const saldo_di_bank = nominal - realisasi;

        const { error } = await supabase
          .from('sumber_dana_institusi')
          .update({
            [editingSD.field]: parsed,
            saldo_di_bank
          })
          .eq('id', editingSD.id);
        
        if (error) {
          console.error(error);
          alert('Gagal menyimpan perubahan sumber dana ke database.');
          fetchData();
        }
      }
    }
    setEditingSD(null);
  };

  // ===== Pengeluaran Bulanan Editing =====
  const startEditPB = (id: string, field: 'nominal_pengeluaran' | 'qty', value: number) => {
    setEditingPB({ id, field });
    setEditPBValue(String(value));
  };

  const commitEditPB = async () => {
    if (!editingPB) return;
    const parsed = Number(editPBValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setPengeluaran(prev => prev.map(item => {
        if (item.id !== editingPB.id) return item;
        const nom = editingPB.field === 'nominal_pengeluaran' ? parsed : item.nominal_pengeluaran;
        const qty = editingPB.field === 'qty' ? parsed : item.qty;
        return { ...item, nominal_pengeluaran: nom, qty, sub_total: nom * qty };
      }));

      const targetItem = pengeluaran.find(p => p.id === editingPB.id);
      if (targetItem) {
        const nom = editingPB.field === 'nominal_pengeluaran' ? parsed : targetItem.nominal_pengeluaran;
        const qty = editingPB.field === 'qty' ? parsed : targetItem.qty;
        const sub_total = nom * qty;

        const { error } = await supabase
          .from('pengeluaran_bulanan_institusi')
          .update({
            [editingPB.field]: parsed,
            sub_total
          })
          .eq('id', editingPB.id);
        
        if (error) {
          console.error(error);
          alert('Gagal menyimpan perubahan pengeluaran ke database.');
          fetchData();
        }
      }
    }
    setEditingPB(null);
  };

  // ===== Shared editable cell render =====
  const renderEditableCellSD = (row: SumberDanaInstitusi, field: 'nominal' | 'realisasi') => {
    const value = row[field];
    const isEditing = editingSD?.id === row.id && editingSD?.field === field;

    if (isEditing) {
      return (
        <td className="sheet-cell sheet-cell-editing text-right">
          <input
            autoFocus
            type="text"
            value={editSDValue}
            onChange={(e) => setEditSDValue(e.target.value)}
            onBlur={commitEditSD}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEditSD(); }
              if (e.key === 'Escape') setEditingSD(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm"
          />
        </td>
      );
    }

    return (
      <td className="sheet-cell sheet-cell-editable text-right" onClick={() => startEditSD(row.id, field, value)}>
        {fmtRupiah(value)}
      </td>
    );
  };

  const renderEditableCellPB = (row: PengeluaranBulananInstitusi, field: 'nominal_pengeluaran' | 'qty') => {
    const value = row[field];
    const isEditing = editingPB?.id === row.id && editingPB?.field === field;

    if (isEditing) {
      return (
        <td className="sheet-cell sheet-cell-editing text-right">
          <input
            autoFocus
            type="text"
            value={editPBValue}
            onChange={(e) => setEditPBValue(e.target.value)}
            onBlur={commitEditPB}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEditPB(); }
              if (e.key === 'Escape') setEditingPB(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm"
          />
        </td>
      );
    }

    return (
      <td className="sheet-cell sheet-cell-editable text-right font-mono" onClick={() => startEditPB(row.id, field, value)}>
        {field === 'qty' ? value : fmtRupiah(value)}
      </td>
    );
  };

  let segmentLabel = institusi.jenjang;
  if (institusi.jenjang === 'UNIVERSITAS') segmentLabel = 'Universitas';
  else if (institusi.jenjang === 'SMA') segmentLabel = 'SMA / SMK';
  const layanan = institusi.status_sekolah === 'NEGERI' ? 'Konvensional' : 'Syariah';

  return (
    <div className="min-h-screen">
      <Header
        title={`Detail Rekening: ${institusi.nama_institusi}`}
        subtitle={`${segmentLabel} (${layanan}) — ${institusi.kabupaten_kota_nama}, ${institusi.provinsi_nama} T.A ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <div>
          <button onClick={() => router.back()} className="btn btn-ghost text-sm">
            <ArrowLeft size={14} />
            Kembali
          </button>
        </div>

        {/* ===== HEADER INFO CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Info Institusi */}
          <div className="metric-card accent-indigo col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={18} className="text-indigo-500" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Nama Pemilik Rekening (Sekolah)</span>
            </div>
            <p className="text-lg font-bold text-text-primary mb-2">{institusi.nama_institusi}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">No. Rekening Bank DaVinci:</span>
              {editingRekening ? (
                <input
                  autoFocus
                  type="text"
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  onBlur={commitRekening}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRekening(); }}
                  className="bg-white/70 border border-accent rounded px-2 py-0.5 text-sm font-mono outline-none"
                />
              ) : (
                <span
                  className="font-mono font-medium text-text-primary cursor-pointer hover:text-accent transition-colors flex items-center gap-1"
                  onClick={() => setEditingRekening(true)}
                >
                  {nomorRekening || '—'}
                  <Edit3 size={12} className="text-text-muted" />
                </span>
              )}
            </div>
          </div>

          {/* Saldo Rekening */}
          <div className={`metric-card ${saldoSurplusDefisit >= 0 ? 'accent-emerald' : 'accent-rose'}`}>
            <div className="flex items-center gap-2 mb-3">
              {saldoSurplusDefisit >= 0 ? (
                <TrendingUp size={18} className="text-emerald-500" />
              ) : (
                <TrendingDown size={18} className="text-rose-500" />
              )}
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Saldo Tersisa (Di Rekening)</span>
            </div>
            <p className={`text-2xl font-bold ${saldoSurplusDefisit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmtRupiah(saldoSurplusDefisit)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {saldoSurplusDefisit >= 0 ? '✅ Dana berhasil ditransfer & sisa tersedia' : '⚠️ Overdraft — transfer tertunda/kurang'}
            </p>
          </div>

          {/* Total Pengeluaran Bulanan */}
          <div className="metric-card accent-amber">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-amber-500" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Mutasi Penarikan (OPEX)</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {fmtRupiah(totalPengeluaran)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Total dana ditarik/dibelanjakan sekolah s.d. Desember {activeTahun}
            </p>
          </div>
        </div>

        {/* ===== TABLE 1: SUMBER DANA ===== */}
        <div>
          <div className="sheet-toolbar">
            <span className="text-sm font-bold text-text-primary">
              📊 Detail Aliran Pagu Dana Masuk (T.A {activeTahun})
            </span>
            <span className="text-xs text-text-muted flex-1">{sumberDana.length} item pagu</span>
          </div>
          <div className="sheet-container" style={{ maxHeight: 'none' }}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 300 }}>Aliran Dana Pagu Masuk</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Pagu Alokasi (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Dana Cair/Terkirim (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Dana Pending (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {sumberDana.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-medium text-text-primary">{row.nama_sumber}</td>
                    {renderEditableCellSD(row, 'nominal')}
                    {renderEditableCellSD(row, 'realisasi')}
                    <td className={`sheet-cell text-right font-medium ${row.saldo_di_bank >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {fmtRupiah(row.saldo_di_bank)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell" />
                  <td className="sheet-footer-cell text-left font-bold">TOTAL PENYALURAN</td>
                  <td className="sheet-footer-cell text-right">{fmtRupiah(totalNominalSumber)}</td>
                  <td className="sheet-footer-cell text-right">{fmtRupiah(totalRealisasiSumber)}</td>
                  <td className={`sheet-footer-cell text-right font-bold ${totalSaldoDiBank >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmtRupiah(totalSaldoDiBank)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ===== TABLE 2: PENGELUARAN BULANAN ===== */}
        <div>
          <div className="sheet-toolbar">
            <span className="text-sm font-bold text-text-primary">
              📅 Mutasi Pengeluaran / Penarikan Dana Rekening Sekolah
            </span>
          </div>
          <div className="sheet-container" style={{ maxHeight: 'none' }}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 150 }}>Bulan Transaksi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Jumlah Penarikan (Rp)</th>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Frekuensi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Sub Total Pengeluaran (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{row.nomor}</td>
                    <td className="sheet-cell text-left font-medium text-text-primary">
                      <Link
                        href={`/dashboard/profil-institusi/${id}/rincian/${row.nomor}`}
                        className="hover:text-accent hover:underline transition-colors text-indigo-700"
                      >
                        {row.bulan}
                      </Link>
                    </td>
                    {renderEditableCellPB(row, 'nominal_pengeluaran')}
                    {renderEditableCellPB(row, 'qty')}
                    <td className="sheet-cell text-right font-medium text-text-primary font-mono">
                      {fmtRupiah(row.sub_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell" />
                  <td className="sheet-footer-cell text-left font-bold" colSpan={3}>Total Mutasi Penarikan</td>
                  <td className={`sheet-footer-cell text-right font-bold font-mono text-sm ${totalPengeluaran <= totalRealisasiSumber ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmtRupiah(totalPengeluaran)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          ✏️ Klik sel Pagu, Transfer Terkirim, atau Qty Penarikan untuk simulasi edit langsung • Saldo & Mutasi bulanan berkalkulasi otomatis
        </p>
      </div>
    </div>
  );
}
