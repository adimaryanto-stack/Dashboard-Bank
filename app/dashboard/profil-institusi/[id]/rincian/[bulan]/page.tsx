'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { getRincianPengeluaranBulanan } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { RincianPengeluaranItem, RincianPengeluaranBulanan } from '@/types';
import { ArrowLeft, Download, Plus } from 'lucide-react';

export default function RincianPengeluaranPage() {
  const params = useParams();
  const router = useRouter();
  const institusiId = params.id as string;
  const nomorBulan = parseInt(params.bulan as string, 10);
  const { activeTahun } = useAppStore();

  const [rincianData, setRincianData] = useState<RincianPengeluaranBulanan | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable state
  const [items, setItems] = useState<RincianPengeluaranItem[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'harga_satuan' | 'qty' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getRincianPengeluaranBulanan(institusiId, nomorBulan, activeTahun);
      setRincianData(res);
      if (res) {
        setItems(res.items);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [institusiId, nomorBulan, activeTahun]);

  // ===== Calculated totals =====
  const subTotal = items.reduce((s, item) => s + item.jumlah, 0);
  const pajakPersen = rincianData?.pajak_persen || 11;
  const pajakNominal = Math.round(subTotal * pajakPersen / 100);
  const total = subTotal + pajakNominal;

  const updateMonthlySummary = async (newItemsList: RincianPengeluaranItem[]) => {
    try {
      const newSubTotal = newItemsList.reduce((s, item) => s + item.jumlah, 0);
      const newPajak = Math.round(newSubTotal * pajakPersen / 100);
      const newTotal = newSubTotal + newPajak;

      const { error } = await supabase
        .from('pengeluaran_bulanan_institusi')
        .update({
          nominal_pengeluaran: newTotal,
          sub_total: newTotal,
        })
        .eq('institusi_id', institusiId)
        .eq('nomor', nomorBulan);

      if (error) {
        console.error(error);
        alert('Gagal menyinkronkan total bulanan ke database.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Editing =====
  const startEdit = (id: string, field: 'harga_satuan' | 'qty', value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const updatedItems = items.map(item => {
        if (item.id !== editingCell.id) return item;
        const harga = editingCell.field === 'harga_satuan' ? parsed : item.harga_satuan;
        const qty = editingCell.field === 'qty' ? parsed : item.qty;
        return { ...item, harga_satuan: harga, qty, jumlah: harga * qty };
      });
      setItems(updatedItems);

      const targetItem = items.find(item => item.id === editingCell.id);
      if (targetItem) {
        const harga = editingCell.field === 'harga_satuan' ? parsed : targetItem.harga_satuan;
        const qty = editingCell.field === 'qty' ? parsed : targetItem.qty;
        const jumlah = harga * qty;

        const { error } = await supabase
          .from('rincian_pengeluaran_item')
          .update({
            [editingCell.field]: parsed,
            jumlah
          })
          .eq('id', editingCell.id);

        if (error) {
          console.error(error);
          alert('Gagal menyimpan perubahan item.');
          fetchData();
        } else {
          await updateMonthlySummary(updatedItems);
        }
      }
    }
    setEditingCell(null);
  };

  const handleExportItems = () => {
    if (!rincianData) return;
    const headers = ['No', 'Keterangan Transaksi / Nama Beban', 'Tarif / Harga Satuan (Rp)', 'Frekuensi', 'Sub Total Beban (Rp)'];
    const csvRows = [headers.join(',')];
    items.forEach((row, idx) => {
      csvRows.push([
        idx + 1,
        `"${row.keterangan}"`,
        row.harga_satuan,
        row.qty,
        row.harga_satuan * row.qty,
      ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Detail_Beban_${rincianData.institusi_nama}_Bulan_${rincianData.bulan}_TA_${activeTahun}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEditableCell = (row: RincianPengeluaranItem, field: 'harga_satuan' | 'qty') => {
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
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm"
          />
        </td>
      );
    }

    return (
      <td className="sheet-cell sheet-cell-editable text-right font-mono" onClick={() => startEdit(row.id, field, value)}>
        {field === 'qty' ? value.toLocaleString('id-ID') : fmtRupiah(value)}
      </td>
    );
  };

  // ===== Add new item =====
  const addItem = async () => {
    if (!rincianData) return;
    try {
      const nextNomor = items.length + 1;
      const newItem = {
        institusi_id: institusiId,
        nomor_bulan: nomorBulan,
        nomor: nextNomor,
        nama_produk_jasa: 'Item Baru',
        harga_satuan: 0,
        qty: 1,
        jumlah: 0,
      };

      const { data, error } = await supabase
        .from('rincian_pengeluaran_item')
        .insert([newItem])
        .select()
        .single();

      if (error) {
        console.error(error);
        alert('Gagal menambahkan item baru ke database.');
        return;
      }

      setItems(prev => [...prev, data]);
      await updateMonthlySummary([...items, data]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Detail Beban Bulanan"
          subtitle="Memuat rincian pengeluaran bulanan sekolah..."
        />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!rincianData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Data tidak ditemukan</h2>
          <p className="text-text-muted mb-4">Sekolah ID: {institusiId}, Bulan: {nomorBulan}</p>
          <button onClick={() => router.back()} className="btn btn-primary">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Detail Beban Bulan: ${rincianData.bulan}`}
        subtitle={`Transaksi Rekening ${rincianData.institusi_nama} — Bulan ${rincianData.bulan} ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => router.back()} className="btn btn-ghost text-sm">
            <ArrowLeft size={14} />
            Kembali ke Rekening
          </button>
          <span className="text-text-muted text-xs">|</span>
          <nav className="flex items-center gap-1 text-xs text-text-muted">
            <Link href="/dashboard/profil-institusi" className="hover:text-accent transition-colors">
              Rekening Sekolah
            </Link>
            <span>→</span>
            <Link href={`/dashboard/profil-institusi/${institusiId}`} className="hover:text-accent transition-colors">
              {rincianData.institusi_nama}
            </Link>
            <span>→</span>
            <span className="text-text-primary font-medium">Beban {rincianData.bulan}</span>
          </nav>
        </div>

        {/* Title Banner */}
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-text-primary">
            📋 Detail Beban Operasional Bulanan Rekening {rincianData.institusi_nama} — Bulan {rincianData.bulan} {activeTahun}
          </h2>
        </div>

        {/* Toolbar */}
        <div className="sheet-toolbar">
          <span className="text-sm font-bold text-text-primary">
            Keterangan Transaksi / Nama Beban
          </span>
          <span className="text-xs text-text-muted flex-1">{items.length} item</span>
          <button className="btn btn-ghost" onClick={addItem}>
            <Plus size={14} />
            Tambah Item
          </button>
          <button className="btn btn-primary" onClick={handleExportItems}>
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="sheet-container" style={{ maxHeight: 'none' }}>
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 60 }}>Nomor</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 300 }}>Keterangan Transaksi / Nama Beban</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Tarif / Harga Satuan (Rp)</th>
                <th className="sheet-header-cell text-center" style={{ width: 100 }}>Frekuensi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Sub Total Beban (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{row.nomor}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">{row.nama_produk_jasa}</td>
                  {renderEditableCell(row, 'harga_satuan')}
                  {renderEditableCell(row, 'qty')}
                  <td className="sheet-cell text-right font-medium text-text-primary font-mono">
                    {fmtRupiah(row.jumlah)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Sub Total */}
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold text-text-primary" colSpan={3}>
                  Sub Total Beban
                </td>
                <td className="sheet-footer-cell text-right font-bold text-text-primary font-mono">
                  {fmtRupiah(subTotal)}
                </td>
              </tr>
              {/* Pajak */}
              <tr>
                <td className="sheet-cell border-b border-border" />
                <td className="sheet-cell border-b border-border text-left text-text-secondary" colSpan={3}>
                  Pajak PPN {pajakPersen}%
                </td>
                <td className="sheet-cell border-b border-border text-right text-text-secondary font-mono">
                  {fmtRupiah(pajakNominal)}
                </td>
              </tr>
              {/* Total */}
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold" colSpan={3}>
                  Total Pengeluaran
                </td>
                <td className="sheet-footer-cell text-right font-bold text-emerald-600 text-base font-mono">
                  {fmtRupiah(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-text-muted">
          ✏️ Klik sel Tarif atau Frekuensi untuk edit transaksi langsung • Sub Total Beban = Tarif × Frekuensi • Total = Sub Total + Pajak PPN {pajakPersen}%
        </p>
      </div>
    </div>
  );
}
