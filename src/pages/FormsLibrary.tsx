// src/pages/FormsLibrary.tsx
import { useState } from 'react';
import { FORMS_LIBRARY } from '@/config/forms';
import type { FormDefinition } from '@/config/forms';
import { FormRenderer } from '@/components/forms/FormRenderer';

const MODULE_LABELS: Record<string, string> = {
  hr: 'Human Resources',
  finance: 'Finance',
  procurement: 'Procurement',
  grants: 'Grants',
  innovations: 'Innovations',
  attendance: 'Attendance',
  inventory: 'Inventory',
  rbac: 'System & Security',
};

const MODULE_ICONS: Record<string, string> = {
  hr: 'badge',
  finance: 'account_balance',
  procurement: 'local_shipping',
  grants: 'volunteer_activism',
  innovations: 'lightbulb',
  attendance: 'schedule',
  inventory: 'inventory_2',
  rbac: 'shield',
};

export function FormsLibrary() {
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [filterModule, setFilterModule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredForms = FORMS_LIBRARY.filter((f) => {
    if (filterModule && f.module !== filterModule) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!f.title.toLowerCase().includes(q) && !f.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const modules = Array.from(new Set(FORMS_LIBRARY.map((f) => f.module)));

  if (selectedForm) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedForm(null)} className="flex items-center gap-1 text-xs font-bold text-aims-navy hover:underline">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Forms Library
        </button>
        <FormRenderer form={selectedForm} onClose={() => setSelectedForm(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Forms Library</h1>
        <p className="text-base font-medium text-white">All operational & employee-facing forms — full detail edition</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Form name or code…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Module</label>
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">All modules</option>
              {modules.map((m) => <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>)}
            </select>
          </div>
          <div className="min-w-[100px] flex items-end">
            <span className="text-xs text-slate-500 font-semibold">{filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[48px]">description</span>
            <p className="text-sm font-bold text-slate-700 mt-2">No forms match your filter</p>
          </div>
        )}
        {filteredForms.map((form) => (
          <button
            key={form.id}
            onClick={() => setSelectedForm(form)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-aims-navy/30 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-aims-navy bg-aims-navy/10 px-2 py-0.5 rounded">{form.code}</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">{MODULE_ICONS[form.module] || 'description'}</span>
                <span className="text-[10px] font-bold text-slate-400">{MODULE_LABELS[form.module] || form.module}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{form.title}</h3>
            {form.confidentiality && <p className="text-[10px] text-aims-orange font-semibold mb-1">{form.confidentiality}</p>}
            <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{form.instructions}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-aims-navy">
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>Open Form
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}