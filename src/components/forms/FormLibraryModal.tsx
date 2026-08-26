// src/components/forms/FormLibraryModal.tsx
// ============================================================
// AIMS — Opens any library form (e.g. FORM-HR-01) inside a modal.
// Triggered app-wide via openForm(id) — surfaced from every module
// that uses the form.
// ============================================================

import { useEffect, useState } from 'react';
import { FORMS_LIBRARY, type FormDefinition } from '@/config/forms';
import { FormRenderer } from './FormRenderer';

export function openForm(formId: string): void {
  window.dispatchEvent(new CustomEvent('aims:open-form', { detail: formId }));
}

export function FormLibraryModal() {
  const [form, setForm] = useState<FormDefinition | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const found = FORMS_LIBRARY.find((f) => f.id === id || f.code.toLowerCase() === id.toLowerCase());
      if (found) setForm(found);
    };
    window.addEventListener('aims:open-form', handler);
    return () => window.removeEventListener('aims:open-form', handler);
  }, []);

  if (!form) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setForm(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 bg-aims-navy text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-white/70 font-mono">FORM-{form.code}</span>
              {form.confidentiality && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/15">{form.confidentiality}</span>}
            </div>
            <h3 className="text-lg font-extrabold">{form.title}</h3>
          </div>
          <button onClick={() => setForm(null)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[22px]">close</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {form.instructions && (
            <div className="p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg mb-4 text-xs text-slate-600">
              <strong>Instructions:</strong> {form.instructions}
            </div>
          )}
          <FormRenderer form={form} onClose={() => setForm(null)} />
        </div>
      </div>
    </div>
  );
}
