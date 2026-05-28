'use client';

import { useAppStore } from '@/lib/store';
import { tahunAnggaranData } from '@/lib/data';
import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { activeTahun, setActiveTahun, toggleSidebar } = useAppStore();
  const activeTahunList = tahunAnggaranData.filter(t => t.status !== 'DRAFT');

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-bg-card transition hidden lg:block">
            <Menu size={18} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Tahun:</span>
            <select
              value={activeTahun}
              onChange={(e) => setActiveTahun(Number(e.target.value))}
              className="select-dropdown"
            >
              {activeTahunList.map(t => (
                <option key={t.tahun} value={t.tahun}>
                  {t.tahun} {t.status === 'ACTIVE' ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari..."
              className="search-input w-40"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-bg-card transition">
            <Bell size={18} className="text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
