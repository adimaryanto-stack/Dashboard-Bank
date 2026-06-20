'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getInstitusiByJenjang, getAlokasiProvinsi, getKabkotaByProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan, AlokasiProvinsi, AlokasiKabupatenKota } from '@/types';
import { Search, Download, Plus, Upload } from 'lucide-react';

const jenjangLabels: Record<string, { label: string; jenjang: Jenjang }> = {
  universitas: { label: 'Universitas', jenjang: 'UNIVERSITAS' },
  sma: { label: 'SMA / SMK', jenjang: 'SMA' },
  smp: { label: 'SMP', jenjang: 'SMP' },
  sd: { label: 'SD', jenjang: 'SD' },
  paud: { label: 'PAUD', jenjang: 'PAUD' },
};

export default function JenjangPage() {
  const params = useParams();
  const slug = params.jenjang as string;
  const config = jenjangLabels[slug] || jenjangLabels.universitas;
  const { activeTahun } = useAppStore();

  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [provinsiList, setProvinsiList] = useState<AlokasiProvinsi[]>([]);
  const [kabkotaOptions, setKabkotaOptions] = useState<AlokasiKabupatenKota[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [list, provs] = await Promise.all([
        getInstitusiByJenjang(config.jenjang),
        getAlokasiProvinsi(activeTahun),
      ]);
      setData(list);
      setProvinsiList(provs);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.jenjang, activeTahun]);

  const [search, setSearch] = useState('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabKotaName, setSelectedKabKotaName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedProvinsiId) {
      setKabkotaOptions([]);
      return;
    }
    getKabkotaByProvinsi(selectedProvinsiId, activeTahun)
      .then(setKabkotaOptions)
      .catch(console.error);
  }, [selectedProvinsiId, activeTahun]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n');
      
      const newItems: InstitusiPendidikan[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(',');
        if (columns.length >= 4) {
          const [nama, npsn, kabkota, prov] = columns.map(c => c.trim().replace(/^"|"$/g, ''));
          newItems.push({
            id: `inst-imp-${Date.now()}-${i}`,
            npsn: npsn || `IMP${i}`,
            nama_institusi: nama || 'Sekolah Import',
            jenjang: config.jenjang,
            kabupaten_kota_id: 'auto-match',
            kabupaten_kota_nama: kabkota || 'Kabupaten Bogor',
            provinsi_nama: prov || 'Jawa Barat',
            status_sekolah: nama.toLowerCase().includes('swasta') ? 'SWASTA' : 'NEGERI',
            nominal_alokasi: 0,
            realisasi_total: 0,
            selisih: 0,
            persentase_penyerapan: 0,
            updated_at: new Date().toISOString().split('T')[0]
          });
        }
      }

      if (newItems.length > 0) {
        setData(prev => [...newItems, ...prev]);
        alert(`${newItems.length} data sekolah berhasil diimport dan dicocokkan!`);
      } else {
        alert('Gagal membaca data CSV. Pastikan format: Nama Sekolah, NPSN, Kabupaten/Kota, Provinsi');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    let result = data;
    
    if (selectedProvinsiId) {
      const prov = provinsiList.find(p => p.provinsi_id === selectedProvinsiId);
      if (prov) {
        result = result.filter(inst => inst.provinsi_nama === prov.provinsi.nama_provinsi);
      }
    }
    
    if (selectedKabKotaName) {
      result = result.filter(inst => inst.kabupaten_kota_nama === selectedKabKotaName);
    }
    
    if (selectedStatus) {
      result = result.filter(inst => inst.status_sekolah === selectedStatus);
    }
    
    if (search) {
      result = result.filter(inst => inst.nama_institusi.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [data, search, selectedProvinsiId, selectedKabKotaName, selectedStatus, provinsiList]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, i) => s + i.nominal_alokasi, 0);
    const real = filtered.reduce((s, i) => s + i.realisasi_total, 0);
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
      const targetSchool = data.find(inst => inst.id === editingCell.id);
      if (!targetSchool) {
        setEditingCell(null);
        return;
      }

      // 1. Update local state
      const updatedData = data.map(inst => {
        if (inst.id !== editingCell.id) return inst;
        const nominal = editingCell.field === 'nominal' ? parsed : inst.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : inst.realisasi_total;
        return {
          ...inst,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0,
        };
      });
      setData(updatedData);

      // 2. Update school in DB (if not a mock ID)
      if (!editingCell.id.startsWith('inst-')) {
        const fieldName = editingCell.field === 'nominal' ? 'nominal_alokasi' : 'realisasi_total';
        const { error: schoolError } = await supabase
          .from('institusi_pendidikan')
          .update({ [fieldName]: parsed })
          .eq('id', editingCell.id);

        if (schoolError) {
          console.error(schoolError);
          alert('Gagal menyimpan perubahan sekolah ke database.');
          fetchData();
          setEditingCell(null);
          return;
        }
      }

      // 3. Recalculate aggregates
      const { data: dbSchools, error: schoolsError } = await supabase
        .from('institusi_pendidikan')
        .select('id, nominal_alokasi, realisasi_total')
        .eq('kabupaten_kota_id', targetSchool.kabupaten_kota_id);

      if (!schoolsError && dbSchools) {
        const newKabNominal = dbSchools.reduce((sum, item) => {
          if (item.id === targetSchool.id) return sum + (editingCell.field === 'nominal' ? parsed : Number(item.nominal_alokasi));
          return sum + Number(item.nominal_alokasi);
        }, 0);

        const newKabRealisasi = dbSchools.reduce((sum, item) => {
          if (item.id === targetSchool.id) return sum + (editingCell.field === 'realisasi' ? parsed : Number(item.realisasi_total));
          return sum + Number(item.realisasi_total);
        }, 0);

        const { data: yearRow } = await supabase
          .from('tahun_anggaran')
          .select('id')
          .eq('tahun', activeTahun)
          .single();

        if (yearRow) {
          const { data: kabRow } = await supabase
            .from('alokasi_kabupaten_kota')
            .select('id, alokasi_provinsi_id')
            .eq('kabupaten_kota_id', targetSchool.kabupaten_kota_id)
            .single();

          if (kabRow) {
            const { error: kabError } = await supabase
              .from('alokasi_kabupaten_kota')
              .update({
                nominal_alokasi: newKabNominal,
                realisasi_total: newKabRealisasi,
              })
              .eq('id', kabRow.id);

            if (!kabError) {
              const { data: kabList } = await supabase
                .from('alokasi_kabupaten_kota')
                .select('id, nominal_alokasi, realisasi_total')
                .eq('alokasi_provinsi_id', kabRow.alokasi_provinsi_id);

              if (kabList) {
                const newProvNominal = kabList.reduce((sum, item) => {
                  if (item.id === kabRow.id) return sum + newKabNominal;
                  return sum + Number(item.nominal_alokasi);
                }, 0);

                const newProvRealisasi = kabList.reduce((sum, item) => {
                  if (item.id === kabRow.id) return sum + newKabRealisasi;
                  return sum + Number(item.realisasi_total);
                }, 0);

                await supabase
                  .from('alokasi_provinsi')
                  .update({
                    nominal_alokasi: newProvNominal,
                    realisasi_total: newProvRealisasi,
                  })
                  .eq('id', kabRow.alokasi_provinsi_id);
              }
            }
          }
        }
      }
    }
    setEditingCell(null);
  };

  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal' | 'realisasi') => {
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
      <td className="sheet-cell sheet-cell-editable text-right font-mono" onClick={() => startEdit(row.id, field, value)}>
        {fmtRupiah(value)}
      </td>
    );
  };

  // Status Pencairan Badge Helper
  const getPencairanStatusBadge = (pct: number) => {
    if (pct >= 100) {
      return <span className="badge bg-emerald-100 text-emerald-700 border-emerald-300">🟢 Sudah Masuk</span>;
    }
    if (pct > 0) {
      return <span className="badge bg-amber-100 text-amber-700 border-amber-300">🟡 Proses ({pct}%)</span>;
    }
    return <span className="badge bg-rose-100 text-rose-700 border-rose-300">🔴 Belum Masuk</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title={`Kategori: ${config.label}`} subtitle={`Daftar status pencairan dana APBN Pendidikan kategori ${config.label} Tahun ${activeTahun}`} />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title={`Kategori: ${config.label}`} subtitle={`Daftar status pencairan dana APBN Pendidikan kategori ${config.label} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiId}
              onChange={(e) => {
                setSelectedProvinsiId(e.target.value);
                setSelectedKabKotaName('');
              }}
              className="select-dropdown"
            >
              <option value="">Semua Provinsi</option>
              {provinsiList.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Kab/Kota:</span>
            <select
              value={selectedKabKotaName}
              onChange={(e) => setSelectedKabKotaName(e.target.value)}
              className="select-dropdown"
              disabled={!selectedProvinsiId}
            >
              <option value="">Semua Kab/Kota</option>
              {kabkotaOptions.map(k => (
                <option key={k.id} value={k.kabupaten_kota.nama_kabupaten_kota}>{k.kabupaten_kota.nama_kabupaten_kota}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Layanan:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="select-dropdown"
            >
              <option value="">Semua Layanan</option>
              <option value="NEGERI">Konvensional</option>
              <option value="SWASTA">Syariah</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={`Cari nama sekolah/institusi...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} sekolah</span>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
            Import CSV
          </button>
          <button className="btn btn-ghost">
            <Plus size={14} />
            Tambah
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
                <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Nama Sekolah / Rekening Penerima</th>
                <th className="sheet-header-cell text-center" style={{ width: 120 }}>Layanan</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 160 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 130 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Alokasi Pagu (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Dana Cair (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 120 }}>Dana Pending</th>
                <th className="sheet-header-cell text-center" style={{ width: 140 }}>Status Pencairan</th>
                <th className="sheet-header-cell text-center" style={{ width: 80 }}>Kode NPSN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">
                    <Link href={`/dashboard/profil-institusi/${row.id}`} className="hover:text-accent hover:underline transition-colors text-indigo-700">
                      {row.nama_institusi}
                    </Link>
                  </td>
                  <td className="sheet-cell text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      row.status_sekolah === 'NEGERI' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {row.status_sekolah === 'NEGERI' ? 'Konvensional' : 'Syariah'}
                    </span>
                  </td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.kabupaten_kota_nama}</td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.provinsi_nama}</td>
                  {renderEditableCell(row, 'nominal')}
                  {renderEditableCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    {getPencairanStatusBadge(row.persentase_penyerapan)}
                  </td>
                  <td className="sheet-cell text-center text-text-muted text-xs font-mono">{row.npsn}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length})</td>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600">{fmtTriliun(totals.selisih)}</td>
                <td className="sheet-footer-cell text-center font-bold">
                  {(totals.pct).toFixed(1)}%
                </td>
                <td className="sheet-footer-cell" />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          ✏️ Klik sel Alokasi Pagu atau Dana Cair untuk edit transfer langsung • Terakumulasi otomatis ke Area & Wilayah
        </p>
      </div>
    </div>
  );
}
