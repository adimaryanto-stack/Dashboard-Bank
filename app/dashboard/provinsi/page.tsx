'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getAlokasiProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi } from '@/types';
import { Search, Download, RefreshCw, Plus } from 'lucide-react';

export default function ProvinsiPage() {
  const { activeTahun } = useAppStore();
  const [data, setData] = useState<AlokasiProvinsi[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Province states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvCode, setNewProvCode] = useState('');
  const [newNominal, setNewNominal] = useState('');
  const [newRealisasi, setNewRealisasi] = useState('');

  const fetchData = () => {
    setLoading(true);
    getAlokasiProvinsi(activeTahun)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [activeTahun]);

  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(p => p.provinsi.nama_provinsi.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, p) => s + p.nominal_alokasi, 0);
    const real = filtered.reduce((s, p) => s + p.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const startEdit = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const target = data.find(p => p.id === editingCell.id);
      if (target) {
        const nominal = editingCell.field === 'nominal' ? parsed : target.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : target.realisasi_total;

        setData(prev => prev.map(p => {
          if (p.id !== editingCell.id) return p;
          return {
            ...p,
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
            selisih: nominal - realisasi,
            persentase_penyerapan: nominal > 0 ? (realisasi / nominal) * 100 : 0,
          };
        }));

        const { error } = await supabase
          .from('alokasi_provinsi')
          .update({
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
          })
          .eq('id', editingCell.id);

        if (error) {
          console.error(error);
          alert('Gagal menyimpan perubahan ke database.');
          fetchData();
        }
      }
    }
    setEditingCell(null);
  };

  const handleExport = () => {
    const headers = ['No', 'Nama Provinsi', 'Alokasi Pagu (Rp)', 'Dana Cair (Rp)', 'Dana Pending (Rp)', 'Persentase Penyaluran (%)'];
    const csvRows = [headers.join(',')];
    filtered.forEach((row, idx) => {
      csvRows.push([
        idx + 1,
        `"${row.provinsi.nama_provinsi}"`,
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
    link.setAttribute('download', `Alokasi_Provinsi_TA_${activeTahun}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProvince = async () => {
    if (!newProvName) return;
    try {
      const { data: years } = await supabase
        .from('tahun_anggaran')
        .select('id')
        .eq('tahun', activeTahun)
        .single();
        
      if (!years) {
        alert('Tahun anggaran aktif tidak ditemukan.');
        return;
      }

      const newProvId = `p-${Date.now()}`;
      const newAlokId = `prov-${Date.now()}`;
      const kodeProv = newProvCode || String(Date.now()).slice(-2);

      const { error: provErr } = await supabase
        .from('provinsi')
        .insert([{ id: newProvId, nama_provinsi: newProvName, kode_provinsi: kodeProv }]);

      if (provErr) throw provErr;

      const nom = Number(newNominal) || 0;
      const real = Number(newRealisasi) || 0;
      const { error: alokErr } = await supabase
        .from('alokasi_provinsi')
        .insert([{
          id: newAlokId,
          tahun_anggaran_id: years.id,
          provinsi_id: newProvId,
          nominal_alokasi: nom,
          realisasi_total: real,
          selisih: nom - real,
          persentase_penyerapan: nom > 0 ? (real / nom) * 100 : 0
        }]);

      if (alokErr) throw alokErr;

      setShowAddModal(false);
      setNewProvName('');
      setNewProvCode('');
      setNewNominal('');
      setNewRealisasi('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan provinsi baru.');
    }
  };

  const renderCell = (row: AlokasiProvinsi, field: 'nominal' | 'realisasi') => {
    const value = field === 'nominal' ? row.nominal_alokasi : row.realisasi_total;
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
      <td
        className="sheet-cell sheet-cell-editable text-right"
        onClick={() => startEdit(row.id, field, value)}
      >
        {fmtRupiah(value)}
      </td>
    );
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Penyaluran Wilayah"
        subtitle={`Penyaluran dan pencairan dana APBN Pendidikan per Wilayah Provinsi Tahun ${activeTahun}`}
      />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari wilayah provinsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} provinsi</span>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Tambah Provinsi
          </button>
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="sheet-container">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Nama Provinsi / Wilayah</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Alokasi Pagu (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Dana Cair (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Dana Pending</th>
                  <th className="sheet-header-cell text-center" style={{ width: 120 }}>% Penyaluran</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-medium text-text-primary">
                      <Link href={`/dashboard/provinsi/${row.provinsi_id}`} className="hover:text-accent hover:underline transition-colors">
                        {row.provinsi.nama_provinsi}
                      </Link>
                    </td>
                    {renderCell(row, 'nominal')}
                    {renderCell(row, 'realisasi')}
                    <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell text-center" />
                  <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length} Provinsi)</td>
                  <td className="sheet-footer-cell text-right">{fmtRupiah(totals.nominal)}</td>
                  <td className="sheet-footer-cell text-right">{fmtRupiah(totals.realisasi)}</td>
                  <td className="sheet-footer-cell text-right text-rose-600">{fmtTriliun(totals.selisih)}</td>
                  <td className="sheet-footer-cell text-center">
                    <PctBadge value={totals.pct} size="md" />
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs text-text-muted">
          ✏️ Klik sel Alokasi Pagu atau Dana Cair untuk edit langsung • Tekan Enter untuk simpan • Escape untuk batal
        </p>
      </div>

      {/* Add Province Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">Tambah Provinsi & Alokasi</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Nama Provinsi</label>
                <input
                  type="text"
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  placeholder="Provinsi Papua Barat"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Kode Provinsi (Opsional)</label>
                <input
                  type="text"
                  value={newProvCode}
                  onChange={(e) => setNewProvCode(e.target.value)}
                  placeholder="92"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Alokasi Pagu (Rp)</label>
                <input
                  type="number"
                  value={newNominal}
                  onChange={(e) => setNewNominal(e.target.value)}
                  placeholder="500000000000"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Dana Cair (Rp)</label>
                <input
                  type="number"
                  value={newRealisasi}
                  onChange={(e) => setNewRealisasi(e.target.value)}
                  placeholder="300000000000"
                  className="search-input w-full pl-3"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAddModal(false)} className="btn btn-ghost">Batal</button>
                <button onClick={handleAddProvince} className="btn btn-primary">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
