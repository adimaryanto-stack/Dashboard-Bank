'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getAlokasiProvinsi, getKabkotaByProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiKabupatenKota, AlokasiProvinsi } from '@/types';
import { Search, Download, RefreshCw, Plus } from 'lucide-react';

export default function KabupatenKotaPage() {
  const { activeTahun } = useAppStore();
  const [provList, setProvList] = useState<AlokasiProvinsi[]>([]);
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('');
  const [localData, setLocalData] = useState<AlokasiKabupatenKota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Load provinces list
  useEffect(() => {
    getAlokasiProvinsi(activeTahun)
      .then(res => {
        setProvList(res);
        if (res.length > 0) {
          const jabar = res.find(p => p.provinsi_id === 'p-12') || res[0];
          setSelectedProvinsi(jabar.provinsi_id);
        }
      })
      .catch(console.error);
  }, [activeTahun]);

  // Load kabkota data when selected province changes
  const fetchKabkotaData = () => {
    if (!selectedProvinsi) return;
    setLoading(true);
    getKabkotaByProvinsi(selectedProvinsi, activeTahun)
      .then(res => {
        setLocalData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchKabkotaData();
  }, [selectedProvinsi, activeTahun]);

  const filtered = useMemo(() => {
    if (!search) return localData;
    return localData.filter(k => k.kabupaten_kota.nama_kabupaten_kota.toLowerCase().includes(search.toLowerCase()));
  }, [localData, search]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, k) => s + k.nominal_alokasi, 0);
    const real = filtered.reduce((s, k) => s + k.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const startEdit = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = async () => {
    if (!editingCell || !selectedProvinsi) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const target = localData.find(k => k.id === editingCell.id);
      if (target) {
        const nominal = editingCell.field === 'nominal' ? parsed : target.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : target.realisasi_total;

        // 1. Update local state
        setLocalData(prev => prev.map(k => {
          if (k.id !== editingCell.id) return k;
          return {
            ...k,
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
            selisih: nominal - realisasi,
            persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0,
          };
        }));

        // 2. Update DB
        const { error: kabError } = await supabase
          .from('alokasi_kabupaten_kota')
          .update({
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
          })
          .eq('id', editingCell.id);

        if (kabError) {
          console.error(kabError);
          alert('Gagal menyimpan perubahan ke database.');
          fetchKabkotaData();
          setEditingCell(null);
          return;
        }

        // 3. Update province aggregate in DB
        const newNominal = localData.reduce((sum, item) => {
          if (item.id === editingCell.id && editingCell.field === 'nominal') return sum + parsed;
          return sum + item.nominal_alokasi;
        }, 0);
        const newRealisasi = localData.reduce((sum, item) => {
          if (item.id === editingCell.id && editingCell.field === 'realisasi') return sum + parsed;
          return sum + item.realisasi_total;
        }, 0);

        const activeProv = provList.find(p => p.provinsi_id === selectedProvinsi);
        if (activeProv) {
          const { error: provError } = await supabase
            .from('alokasi_provinsi')
            .update({
              nominal_alokasi: newNominal,
              realisasi_total: newRealisasi,
            })
            .eq('id', activeProv.id);
          
          if (provError) {
            console.error(provError);
          }
        }
      }
    }
    setEditingCell(null);
  };

  const renderEditableCell = (row: AlokasiKabupatenKota, field: 'nominal' | 'realisasi') => {
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
      <td className="sheet-cell sheet-cell-editable text-right" onClick={() => startEdit(row.id, field, value)}>
        {fmtRupiah(value)}
      </td>
    );
  };

  const selectedProvName = provList.find(p => p.provinsi_id === selectedProvinsi)?.provinsi.nama_provinsi || '';

  return (
    <div className="min-h-screen">
      <Header title="Penyaluran Area" subtitle={`Dana alokasi & cair per area kabupaten/kota — ${selectedProvName} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Wilayah Provinsi:</span>
            <select
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              className="select-dropdown"
            >
              {provList.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari area kab/kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} area</span>
          <button className="btn btn-primary">
            <Plus size={14} />
            Tambah Area
          </button>
          <button className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Area Kabupaten / Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 150 }}>Wilayah Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 170 }}>Alokasi Pagu (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 170 }}>Dana Cair (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Dana Pending</th>
                <th className="sheet-header-cell text-center" style={{ width: 120 }}>% Penyaluran</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">{row.kabupaten_kota.nama_kabupaten_kota}</td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.provinsi_nama}</td>
                  {renderEditableCell(row, 'nominal')}
                  {renderEditableCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={row.persentase_penyerapan} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length})</td>
                <td className="sheet-footer-cell" />
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
          ✏️ Klik sel Alokasi Pagu atau Dana Cair untuk edit langsung • Terakumulasi otomatis ke Provinsi
        </p>
      </div>
    </div>
  );
}
