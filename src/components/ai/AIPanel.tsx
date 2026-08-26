// src/components/ai/AIPanel.tsx
// ============================================================
// AIMS — renders AI intelligence insights consistently across modules
// ============================================================

import { cn } from '@/lib/utils';
import type { AiInsight, AiSeverity } from '@/lib/aiEngine';

const SEVERITY_STYLE: Record<AiSeverity, { icon: string; box: string; label: string }> = {
  info: { icon: 'lightbulb', box: 'bg-aims-navy/5 border-aims-navy/15', label: 'text-aims-navy' },
  success: { icon: 'check_circle', box: 'bg-aims-green/5 border-aims-green/20', label: 'text-aims-green' },
  warning: { icon: 'warning', box: 'bg-aims-orange/5 border-aims-orange/25', label: 'text-aims-orange' },
  critical: { icon: 'error', box: 'bg-red-50 border-red-200', label: 'text-red-600' },
};

interface AIPanelProps {
  title: string;
  insights: AiInsight[];
  onAction?: (insight: AiInsight) => void;
  className?: string;
}

export function AIPanel({ title, insights, onAction, className }: AIPanelProps) {
  if (insights.length === 0) return null;
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 border-l-4 border-l-aims-navy p-5 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-aims-navy/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-aims-navy text-[20px]">auto_awesome</span>
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider">AI Insights · auto-generated</p>
        </div>
      </div>
      <div className="space-y-2">
        {insights.map((ins) => {
          const s = SEVERITY_STYLE[ins.severity];
          return (
            <div key={ins.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', s.box)}>
              <span className={cn('material-symbols-outlined text-[18px] mt-0.5', s.label)}>{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-bold', s.label)}>{ins.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ins.detail}</p>
              </div>
              {ins.action && onAction && (
                <button onClick={() => onAction(ins)} className={cn('text-[10px] font-bold shrink-0 hover:underline', s.label)}>{ins.action}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
