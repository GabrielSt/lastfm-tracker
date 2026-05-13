import type { Trend } from '@/types';

interface TrendBadgeProps {
  trend: Trend;
  delta?: number;
  className?: string;
}

const trendConfig = {
  up: { icon: '▲', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  down: { icon: '▼', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  stable: { icon: '—', color: 'text-lastfm-muted', bg: 'bg-white/5' },
  new: { icon: 'NEW', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  unknown: { icon: '?', color: 'text-lastfm-muted', bg: 'bg-white/5' },
};

export function TrendBadge({ trend, delta, className = '' }: TrendBadgeProps) {
  const cfg = trendConfig[trend];
  const label =
    trend === 'new'
      ? 'NEW'
      : trend === 'stable'
      ? '—'
      : delta !== undefined
      ? `${Math.abs(delta)}`
      : cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold ${cfg.color} ${cfg.bg} ${className}`}
    >
      {trend !== 'new' && trend !== 'stable' && trend !== 'unknown' && (
        <span>{cfg.icon}</span>
      )}
      {label}
    </span>
  );
}
