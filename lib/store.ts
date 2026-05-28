'use client';

import { create } from 'zustand';

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
