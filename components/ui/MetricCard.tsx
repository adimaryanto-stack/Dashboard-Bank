'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  accent: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
  trend?: { value: number; label: string };
}

export default function MetricCard({ title, value, subtitle, icon, accent, trend }: MetricCardProps) {
  return (
    <div className={`metric-card accent-${accent} animate-fade-in-up`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-[10px] text-text-muted">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          accent === 'indigo' ? 'bg-indigo-100' : 
          accent === 'emerald' ? 'bg-emerald-100' : 
          accent === 'amber' ? 'bg-amber-100' : 
          accent === 'rose' ? 'bg-rose-100' : 'bg-blue-100'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
