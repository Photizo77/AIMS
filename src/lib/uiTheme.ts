// src/lib/uiTheme.ts
// ============================================================
// AIMS — shared UI theme constants (single source of truth)
// The AIMS brand palette + card accent maps were previously duplicated
// across Dashboard, Tasks, Grants and the grants pipeline board.
// ============================================================

export type ColorKey = 'green' | 'navy' | 'orange' | 'mint' | 'red';

/** Solid chip / badge backgrounds (colored background + white text) */
export const CHIP: Record<ColorKey, string> = {
  green: 'bg-aims-green text-white',
  navy: 'bg-aims-navy text-white',
  orange: 'bg-aims-orange text-white',
  mint: 'bg-aims-mint text-aims-green',
  red: 'bg-red-500 text-white',
};

/** Card top-border accent */
export const ACCENT: Record<ColorKey, string> = {
  green: 'border-t-aims-green',
  navy: 'border-t-aims-navy',
  orange: 'border-t-aims-orange',
  mint: 'border-t-aims-mint',
  red: 'border-t-red-500',
};

/** Progress-bar fill */
export const FILL: Record<ColorKey, string> = {
  green: 'bg-aims-green',
  navy: 'bg-aims-navy',
  orange: 'bg-aims-orange',
  mint: 'bg-aims-green',
  red: 'bg-red-500',
};

/** Safe list of colors allowed by Tailwind's static analysis */
export const COLOR_KEYS: ColorKey[] = ['green', 'navy', 'orange', 'mint', 'red'];
