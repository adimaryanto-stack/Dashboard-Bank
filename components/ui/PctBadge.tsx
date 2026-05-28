'use client';

import { getPctBgColor, fmtPct } from '@/lib/utils/formatters';

interface PctBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export default function PctBadge({ value, size = 'sm' }: PctBadgeProps) {
  const emoji = value >= 80 ? '🟢' : value >= 50 ? '🟡' : '🔴';
  
  return (
    <span className={`badge ${getPctBgColor(value)} ${size === 'md' ? 'text-xs px-3 py-1' : ''}`}>
      <span>{emoji}</span>
      <span>{fmtPct(value)}</span>
    </span>
  );
}
