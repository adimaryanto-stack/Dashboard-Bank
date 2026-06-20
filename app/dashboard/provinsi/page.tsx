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
          <button className="btn btn-primary">
            <Plus size={14} />
            Tambah Provinsi
          </button>
          <button onClick={fetchData} className="btn btn-ghost">
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
    </div>
  );
}
