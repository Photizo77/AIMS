// src/components/ui/RowActionsMenu.tsx
// ============================================================
// AIMS — compact per-row action menu for tables.
// Long inline action clusters ("View Profile · Edit Role · Reset Credential ·
// Deactivate") squeeze table cells and wrap awkwardly. This collapses them
// into a single kebab (⋮) button that opens a menu, keeping every row to one
// consistent control. Used by every table with more than one row action.
// ============================================================

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface RowAction {
  label: string;
  icon?: string;
  onClick: () => void;
  /** Danger styling for destructive actions (deactivate, delete, reject) */
  tone?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
  /** Renders a divider above this item */
  divider?: boolean;
  title?: string;
}

export function RowActionsMenu({
  actions,
  label = 'Row actions',
  align = 'right',
}: { actions: RowAction[]; label?: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        aria-label={label}
        className={cn(
          'w-8 h-8 inline-flex items-center justify-center rounded-lg border transition-colors',
          open ? 'border-aims-navy/30 bg-aims-navy/5 text-aims-navy' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-aims-navy',
        )}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute z-40 mt-1 min-w-[196px] rounded-xl border border-slate-200 bg-white shadow-lg py-1 overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {visible.map((a) => (
            <div key={a.label}>
              {a.divider && <div className="my-1 border-t border-slate-100" />}
              <button
                type="button"
                role="menuitem"
                disabled={a.disabled}
                title={a.title}
                onClick={() => { setOpen(false); a.onClick(); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors',
                  a.disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : a.tone === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : a.tone === 'primary'
                        ? 'text-aims-green hover:bg-aims-green/5'
                        : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {a.icon && <span className="material-symbols-outlined text-[16px] shrink-0">{a.icon}</span>}
                <span className="truncate">{a.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
