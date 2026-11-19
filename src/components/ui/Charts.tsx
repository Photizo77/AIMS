// src/components/ui/Charts.tsx
// ============================================================
// AIMS — dependency-free chart primitives (CSS + inline SVG).
// Used by the Reports module so board & donor summaries carry real
// graphics: donut composition, column charts, stat bars and rings.
// Colours follow the ARDHI palette (navy / green / orange / mint).
// ============================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const CHART_COLORS = {
  navy: '#053664',
  green: '#286b25',
  orange: '#eb3b14',
  mint: '#6ea96a',
  slate: '#94a3b8',
  red: '#dc2626',
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

export interface ChartDatum {
  label: string;
  value: number;
  color: ChartColor;
  display?: string;
}

/** Donut composition chart with a centre readout */
export function DonutChart({
  data, size = 168, thickness = 24, centerLabel, centerValue,
}: { data: ChartDatum[]; size?: number; thickness?: number; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel ?? 'chart'}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total > 0 && data.map((d) => {
            const length = (d.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const circle = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CHART_COLORS[d.color]}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return circle;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 20, fontWeight: 800 }}>{centerValue ?? total}</text>
        {centerLabel && <text x="50%" y="60%" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{centerLabel}</text>}
      </svg>
    </div>
  );
}

/** Vertical column chart — good for stage counts and month-style comparisons */
export function ColumnChart({
  data, height = 150, showValues = true,
}: { data: ChartDatum[]; height?: number; showValues?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0">
            {showValues && <span className="text-[9px] font-extrabold text-slate-700">{d.display ?? d.value}</span>}
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: CHART_COLORS[d.color], minHeight: 3 }}
              title={`${d.label}: ${d.display ?? d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5 border-t border-slate-100 pt-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex-1 min-w-0">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide text-center leading-tight truncate">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal stat bar with label, value and optional forecast marker */
export function StatBar({
  label, value, max, display, color = 'navy', sub, markerPct,
}: {
  label: string; value: number; max: number; display: string;
  color?: ChartColor; sub?: string; markerPct?: number;
}) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-bold text-slate-700 truncate">{label}</span>
        <span className="text-[11px] font-extrabold text-slate-900 shrink-0">{display}</span>
      </div>
      <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-visible">
        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: CHART_COLORS[color] }} />
        {typeof markerPct === 'number' && (
          <span
            className="absolute -top-1 w-0.5 h-[18px] bg-aims-orange rounded"
            style={{ left: `${Math.max(0, Math.min(100, markerPct))}%` }}
            title={`Forecast ${markerPct}%`}
          />
        )}
      </div>
      {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Compact KPI ring — used in report stat cards */
export function ProgressRing({ pct, size = 44, thickness = 5, color = 'green', label }: { pct: number; size?: number; thickness?: number; color?: ChartColor; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={CHART_COLORS[color]} strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-slate-700">{label ?? `${clamped}%`}</span>
    </div>
  );
}

/** Legend rows for a donut / composition chart */
export function ChartLegend({ data, total, formatter }: { data: ChartDatum[]; total: number; formatter?: (n: number) => string }) {
  return (
    <ul className="space-y-1.5 min-w-0">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[d.color] }} />
            <span className="text-slate-600 truncate flex-1">{d.label}</span>
            <span className="font-bold text-slate-900 shrink-0">{formatter ? formatter(d.value) : d.value}</span>
            <span className="text-slate-400 w-8 text-right shrink-0">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Section wrapper used across the report */
export function ReportPanel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
