'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { alokasiProvinsiData } from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi } from '@/types';
import { Search, Download, RefreshCw, Plus } from 'lucide-react';

export default function ProvinsiPage() {
  const [data, setData] = useState<AlokasiProvinsi[]>(alokasiProvinsiData);
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

  const commitEdit = () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setData(prev => prev.map(p => {
        if (p.id !== editingCell.id) return p;
        const nominal = editingCell.field === 'nominal' ? parsed : p.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : p.realisasi_total;
        return {
          ...p,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? (realisasi / nominal) * 100 : 0,
        };
      }));
    }
    setEditingCell(null);
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
      <Header title="Provinsi" subtitle="Spreadsheet alokasi anggaran 38 provinsi" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} provinsi</span>
          <button className="btn btn-primary">
            <Plus size={14} />
            Tambah Provinsi
          </button>
          <button className="btn btn-ghost">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Nama Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 120 }}>% Penyerapan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">{row.provinsi.nama_provinsi}</td>
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
        </div>

        <p className="mt-3 text-xs text-text-muted">
          ✏️ Klik sel Nominal atau Realisasi untuk edit langsung • Tekan Enter untuk simpan • Escape untuk batal
        </p>
      </div>
    </div>
  );
}
