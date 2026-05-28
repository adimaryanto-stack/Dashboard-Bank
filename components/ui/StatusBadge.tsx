'use client';

import { BudgetStatus } from '@/types';

interface StatusBadgeProps {
  status: BudgetStatus;
}

const statusConfig: Record<BudgetStatus, { label: string; classes: string; icon: string }> = {
  DRAFT: {
    label: 'DRAFT',
    classes: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '📝',
  },
  ACTIVE: {
    label: 'ACTIVE',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: '✓',
  },
  CLOSED: {
    label: 'CLOSED',
    classes: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: '🔒',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`badge ${config.classes}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
