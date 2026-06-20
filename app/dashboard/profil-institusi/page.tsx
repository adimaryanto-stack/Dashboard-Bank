'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { getAllInstitusi, getAlokasiProvinsi } from '@/lib/data';
import { fmtRupiah } from '@/lib/utils/formatters';
import { Jenjang, AlokasiProvinsi, InstitusiPendidikan } from '@/types';
import { Search, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const jenjangOptions: { value: '' | Jenjang; label: string }[] = [
  { value: '', label: 'Semua Kategori' },
  { value: 'UNIVERSITAS', label: 'Universitas' },
  { value: 'SMA', label: 'SMA / SMK' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SD', label: 'SD' },
  { value: 'PAUD', label: 'PAUD' },
];

export default function ProfilInstitusiPage() {
  const { activeTahun } = useAppStore();
  const [allInstitusi, setAllInstitusi] = useState<InstitusiPendidikan[]>([]);
  const [provinsiList, setProvinsiList] = useState<AlokasiProvinsi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'' | Jenjang>('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schools, provs] = await Promise.all([
          getAllInstitusi(),
          getAlokasiProvinsi(activeTahun),
        ]);
        setAllInstitusi(schools);
        setProvinsiList(provs);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTahun]);

  const filtered = useMemo(() => {
    let result = allInstitusi;
    if (selectedJenjang) {
      result = result.filter(inst => inst.jenjang === selectedJenjang);
    }
    if (selectedProvinsiId) {
      const prov = provinsiList.find(p => p.provinsi_id === selectedProvinsiId);
      if (prov) {
        result = result.filter(inst => inst.provinsi_nama === prov.provinsi.nama_provinsi);
      }
    }
    if (search) {
      result = result.filter(inst =>
        inst.nama_institusi.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [allInstitusi, search, selectedJenjang, selectedProvinsiId, provinsiList]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Rekening Sekolah"
          subtitle="Klik nama sekolah untuk melihat detail profil keuangan & mutasi rekening"
        />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Rekening Sekolah"
        subtitle="Klik nama sekolah untuk melihat detail profil keuangan & mutasi rekening"
      />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Kategori:</span>
            <select
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value as '' | Jenjang)}
              className="select-dropdown"
            >
              {jenjangOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiId}
              onChange={(e) => setSelectedProvinsiId(e.target.value)}
              className="select-dropdown"
            >
              <option value="">Semua Provinsi</option>
              {provinsiList.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari nama sekolah/rekening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} sekolah</span>
        </div>

        {/* Table */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 250 }}>Nama Sekolah / Pemilik Rekening</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>Kategori</th>
                <th className="sheet-header-cell text-center" style={{ width: 115 }}>Layanan</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 150 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 130 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Alokasi Pagu (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Dana Cair (Rp)</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>% Penyaluran</th>
                <th className="sheet-header-cell text-center" style={{ width: 60 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                let segmentLabel = row.jenjang;
                if (row.jenjang === 'UNIVERSITAS') segmentLabel = 'Universitas';
                else if (row.jenjang === 'SMA') segmentLabel = 'SMA / SMK';

                return (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-medium text-text-primary">
                      <Link
                        href={`/dashboard/profil-institusi/${row.id}`}
                        className="hover:text-accent hover:underline transition-colors text-indigo-700"
                      >
                        {row.nama_institusi}
                      </Link>
                    </td>
                    <td className="sheet-cell text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        row.jenjang === 'UNIVERSITAS' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : row.jenjang === 'SMA' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : row.jenjang === 'SMP' ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : row.jenjang === 'SD' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-pink-100 text-pink-700 border border-pink-200'
                      }`}>
                        {segmentLabel}
                      </span>
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
                    <td className="sheet-cell text-right font-mono">{fmtRupiah(row.nominal_alokasi)}</td>
                    <td className="sheet-cell text-right font-mono">{fmtRupiah(row.realisasi_total)}</td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
                    </td>
                    <td className="sheet-cell text-center">
                      <Link
                        href={`/dashboard/profil-institusi/${row.id}`}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-indigo-100 text-text-muted hover:text-accent transition-colors"
                        title="Lihat Detail Rekening"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          🏫 Klik nama sekolah atau ikon untuk melihat rincian transaksi rekening & status transfer
        </p>
      </div>
    </div>
  );
}
