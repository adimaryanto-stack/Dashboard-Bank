'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/ui/StatusBadge';
import { getTahunAnggaran, updateTahunAnggaranData } from '@/lib/data';
import { fmtRupiah } from '@/lib/utils/formatters';
import { TahunAnggaran, BudgetStatus } from '@/types';
import { Plus, Eye, Power, Lock, Trash2 } from 'lucide-react';

export default function APBNPage() {
  const { setActiveTahun } = useAppStore();
  const [data, setData] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTahun, setNewTahun] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadData = () => {
    setLoading(true);
    getTahunAnggaran()
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
    loadData();
  }, []);


  const handleActivate = async (id: string) => {
    if (!confirm('Aktifkan tahun ini? Tahun ACTIVE sebelumnya akan di-CLOSED.')) return;
    const updated = data.map(t => ({
      ...t,
      status: (t.id === id ? 'ACTIVE' : t.status === 'ACTIVE' ? 'CLOSED' : t.status) as BudgetStatus
    }));
    setData(updated);
    try {
      await updateTahunAnggaranData(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status tahun di database.');
      loadData();
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Tutup tahun ini? Data akan menjadi read-only.')) return;
    const updated = data.map(t => t.id === id ? { ...t, status: 'CLOSED' as BudgetStatus } : t);
    setData(updated);
    try {
      await updateTahunAnggaranData(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal menutup tahun anggaran di database.');
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const item = data.find(t => t.id === id);
    if (item?.status !== 'DRAFT') return;
    if (!confirm('Hapus tahun ini?')) return;
    const updated = data.filter(t => t.id !== id);
    setData(updated);
    try {
      await updateTahunAnggaranData(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus tahun anggaran dari database.');
      loadData();
    }
  };

  const handleAdd = async () => {
    if (!newTahun || !newTotal) return;
    const exists = data.find(t => t.tahun === Number(newTahun));
    if (exists) { alert('Tahun sudah ada!'); return; }
    const updated = [...data, {
      id: String(Date.now()),
      tahun: Number(newTahun),
      total_anggaran: Number(newTotal),
      status: 'DRAFT' as BudgetStatus,
      created_at: new Date().toISOString(),
    }];
    setData(updated);
    try {
      await updateTahunAnggaranData(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan tahun anggaran ke database.');
      loadData();
    }
    setShowModal(false);
    setNewTahun('');
    setNewTotal('');
  };

  const startInlineEdit = (id: string, currentVal: number) => {
    const item = data.find(t => t.id === id);
    if (item?.status === 'CLOSED') return;
    setEditingId(id);
    setEditValue(String(currentVal));
  };

  const commitInlineEdit = async () => {
    if (!editingId) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const updated = data.map(t => t.id === editingId ? { ...t, total_anggaran: parsed } : t);
      setData(updated);
      try {
        await updateTahunAnggaranData(updated);
      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan perubahan pagu ke database.');
        loadData();
      }
    }
    setEditingId(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Kelola Pagu Pusat" subtitle="Kelola pagu dana pendidikan pusat per tahun anggaran" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar">
          <h3 className="text-sm font-semibold text-text-primary flex-1">
            Pagu Dana Pusat Pertahun (APBN)
          </h3>
          <span className="text-xs text-text-muted">{data.length} tahun</span>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Tambah Tahun
          </button>
        </div>

        {/* Table */}
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
                  <th className="sheet-header-cell text-center" style={{ width: 100 }}>Tahun</th>
                  <th className="sheet-header-cell text-right">Total Pagu Anggaran Pusat (Rp)</th>
                  <th className="sheet-header-cell text-center" style={{ width: 120 }}>Status</th>
                  <th className="sheet-header-cell text-center" style={{ width: 200 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.sort((a, b) => a.tahun - b.tahun).map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted">{idx + 1}</td>
                    <td className="sheet-cell text-center font-semibold text-text-primary">
                      <Link
                        href="/dashboard"
                        onClick={() => setActiveTahun(row.tahun)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        {row.tahun}
                      </Link>
                    </td>
                    <td
                      className={`sheet-cell text-right ${row.status !== 'CLOSED' ? 'sheet-cell-editable' : ''}`}
                      onClick={() => startInlineEdit(row.id, row.total_anggaran)}
                    >
                      {editingId === row.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitInlineEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full bg-transparent outline-none text-right font-mono"
                        />
                      ) : (
                        <span className={row.status === 'CLOSED' ? 'text-text-muted' : ''}>
                          {fmtRupiah(row.total_anggaran)}
                          {row.status !== 'CLOSED' && <span className="ml-1 text-text-muted text-[10px]">✏️</span>}
                        </span>
                      )}
                    </td>
                    <td className="sheet-cell text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="sheet-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="btn btn-ghost py-1 px-2 text-xs" title="Lihat">
                          <Eye size={12} />
                        </button>
                        {row.status === 'DRAFT' && (
                          <>
                            <button onClick={() => handleActivate(row.id)} className="btn btn-success py-1 px-2 text-xs" title="Aktifkan">
                              <Power size={12} />
                            </button>
                            <button onClick={() => handleDelete(row.id)} className="btn btn-danger py-1 px-2 text-xs" title="Hapus">
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        {row.status === 'ACTIVE' && (
                          <button onClick={() => handleClose(row.id)} className="btn btn-warning py-1 px-2 text-xs" title="Tutup">
                            <Lock size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status Legend */}
        <div className="mt-4 flex items-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> DRAFT — Baru, bisa diedit & dihapus
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> ACTIVE — Tahun berjalan aktif (hanya 1)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> CLOSED — Arsip, read-only
          </div>
        </div>
      </div>

      {/* Add Year Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">Tambah Tahun & Pagu Pusat</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Tahun</label>
                <input
                  type="number"
                  value={newTahun}
                  onChange={(e) => setNewTahun(e.target.value)}
                  placeholder="2027"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Total Pagu Anggaran Pusat (Rp)</label>
                <input
                  type="number"
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                  placeholder="800000000000000"
                  className="search-input w-full pl-3"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
                <button onClick={handleAdd} className="btn btn-primary">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
