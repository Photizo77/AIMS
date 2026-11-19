// src/components/ui/KanbanBoard.tsx
// ============================================================
// AIMS — shared Kanban primitives.
// Every board (Grants, Pipelines, Innovations/Tasks) uses the same rules:
//  · all cards share one standard height, so a column reads as a neat stack
//    regardless of how much text each record carries;
//  · a column displays 3 cards and the rest scroll inside that column
//    (one vertical scrollbar per column, not one for the whole board).
// ============================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Standard card height — the first card's size becomes the size for all. */
export const KANBAN_CARD_HEIGHT = 'h-[188px]';

/** How many cards a column shows before it starts scrolling. */
export const KANBAN_VISIBLE_CARDS = 3;

/**
 * Column scroll body: exactly three standard cards tall, then it scrolls.
 * 188px × 3 + 8px gaps × 2 + 8px padding × 2 = 596px.
 */
export const KANBAN_COLUMN_BODY = 'bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[200px] max-h-[596px] overflow-y-auto overflow-x-hidden';

/** A single card — fixed height, clipped interior, actions pinned to the base. */
export function KanbanCard({
  onClick, children, className,
}: { onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow group flex flex-col overflow-hidden',
        onClick && 'cursor-pointer',
        KANBAN_CARD_HEIGHT,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The scrollable card list of one column */
export function KanbanColumnBody({
  count, emptyLabel, children,
}: { count: number; emptyLabel: string; children: ReactNode }) {
  if (count === 0) {
    return (
      <div className={KANBAN_COLUMN_BODY}>
        <p className="text-xs text-slate-400 text-center py-8 italic">{emptyLabel}</p>
      </div>
    );
  }
  return <div className={KANBAN_COLUMN_BODY}>{children}</div>;
}

/** Column header chip — label + count */
export function KanbanColumnHeader({ label, count, chipClass }: { label: string; count: number; chipClass: string }) {
  return (
    <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between shrink-0', chipClass)}>
      <span className="text-xs font-bold uppercase tracking-wider text-white truncate">{label}</span>
      <span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full shrink-0">{count}</span>
    </div>
  );
}
