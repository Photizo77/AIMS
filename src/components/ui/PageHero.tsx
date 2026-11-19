// src/components/ui/PageHero.tsx
// ============================================================
// AIMS — compact institutional identity band for page tops.
// The old hero was a 120px slab of navy above every page; this is the same
// ARDHI navy gradient squeezed into a slim card (icon + title + one-line
// subtitle, optional right-hand actions) so pages keep their identity without
// pushing the working content down the fold.
// ============================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  /** Material Symbols icon shown in the leading chip */
  icon?: string;
  /** Right-aligned actions (buttons/links). Style them for a navy background. */
  actions?: ReactNode;
  /** Small uppercase hint on the right (e.g. counts, timestamps) */
  meta?: string;
  className?: string;
}

/** Button/figure classes tuned for placement on the navy band */
export const HERO_BTN = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors';
export const HERO_BTN_SOLID = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold bg-white text-aims-navy hover:bg-aims-mint transition-colors';

export function PageHero({ title, subtitle, icon, actions, meta, className }: PageHeroProps) {
  return (
    <div
      className={cn(
        'bg-grad-navy rounded-xl px-4 sm:px-5 py-3.5 shadow-sm flex items-center justify-between gap-3 flex-wrap',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] sm:text-xs font-medium text-white/75 leading-snug truncate">{subtitle}</p>}
        </div>
      </div>

      {(actions || meta) && (
        <div className="flex items-center gap-2 shrink-0">
          {meta && <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-white/60">{meta}</span>}
          {actions}
        </div>
      )}
    </div>
  );
}
