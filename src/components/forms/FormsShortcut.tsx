// src/components/forms/FormsShortcut.tsx
// ============================================================
// AIMS — In-module shortcut strip that opens the ARDHI forms used by
// that module (e.g. HR tab shows FORM-HR-01..05).
// ============================================================

import { FORMS_LIBRARY } from '@/config/forms';
import { openForm } from './FormLibraryModal';

interface FormsShortcutProps {
  module: string | string[];
  title?: string;
}

export function FormsShortcut({ module, title = 'Module Forms' }: FormsShortcutProps) {
  const modules = Array.isArray(module) ? module : [module];
  const forms = FORMS_LIBRARY.filter((f) => modules.includes(f.module));
  if (forms.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px]">description</span>{title}
      </p>
      <div className="flex flex-wrap gap-2">
        {forms.map((f) => (
          <button
            key={f.id}
            onClick={() => openForm(f.id)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-aims-navy hover:border-aims-navy/40 hover:bg-aims-navy/5 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[13px]">description</span>FORM-{f.code} · {f.title}
          </button>
        ))}
      </div>
    </div>
  );
}
