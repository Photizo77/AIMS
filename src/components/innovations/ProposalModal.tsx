// src/components/innovations/ProposalModal.tsx
// ============================================================
// AIMS — New Innovation / Revise Proposal form (Innovator).
// Captures title · description · category (Technology / Process /
// Service) · expected impact · timeline, then budget line items
// (equipment / software / personnel / other). Saving writes the
// proposal to aims_projects as a draft (or updates a returned
// "changes" draft). Submitting for review happens from the page.
// ============================================================

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { innovationService } from '@/services/innovationService';
import type { InnovationCategory, InnovationProject, ProjectBudgetLine } from '@/types';

const CATEGORIES: InnovationCategory[] = ['Technology', 'Process', 'Service'];

const KIND_OPTIONS: { value: ProjectBudgetLine['kind']; label: string; icon: string }[] = [
  { value: 'equipment', label: 'Equipment', icon: 'hardware' },
  { value: 'software', label: 'Software', icon: 'code' },
  { value: 'personnel', label: 'Personnel', icon: 'groups' },
  { value: 'other', label: 'Other', icon: 'category' },
];

const blankLine = (): ProjectBudgetLine => ({ kind: 'equipment', item: '', amount: 0 });

export function ProposalModal({ open, editing, creatorName, onClose, onSaved }: {
  open: boolean;
  /** Project being revised (proposal with draft/changes status), or null for a new proposal */
  editing: InnovationProject | null;
  creatorName: string;
  onClose: () => void;
  onSaved: (p: InnovationProject) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InnovationCategory>('Technology');
  const [expectedImpact, setExpectedImpact] = useState('');
  const [timeline, setTimeline] = useState('');
  const [lines, setLines] = useState<ProjectBudgetLine[]>([blankLine()]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setCategory(editing.lifecycle?.category ?? 'Technology');
      setExpectedImpact(editing.lifecycle?.expectedImpact ?? '');
      setTimeline(editing.lifecycle?.timeline ?? '');
      setLines((editing.lifecycle?.budgetLines?.length ? editing.lifecycle.budgetLines : [blankLine()]).map((l) => ({ ...l })));
    } else {
      setTitle('');
      setDescription('');
      setCategory('Technology');
      setExpectedImpact('');
      setTimeline('');
      setLines([blankLine()]);
    }
  }, [open, editing]);

  if (!open) return null;

  const total = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const setLine = (i: number, patch: Partial<ProjectBudgetLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, blankLine()]);
  const removeLine = (i: number) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    let saved: InnovationProject | null = null;
    if (editing) {
      const updated = innovationService.updateProposal(editing.id, { title, description, category, expectedImpact, timeline });
      if (updated) saved = innovationService.setBudgetLines(editing.id, lines) ?? updated;
    } else {
      const created = innovationService.createProposal({ title, description, category, expectedImpact, timeline, leadName: creatorName });
      saved = innovationService.setBudgetLines(created.id, lines) ?? created;
    }
    if (saved) onSaved(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-grad-navy px-6 py-4 text-white shrink-0 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-aims-mint flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">lightbulb</span>{editing ? 'Revise Innovation Proposal' : 'New Innovation'}
            </p>
            <h2 className="text-lg font-extrabold text-white mt-0.5">{editing ? 'Update proposal after feedback' : 'Innovation Project Proposal'}</h2>
            <p className="text-xs text-white/85">Stored in aims_projects as a {editing ? 'revision' : 'draft'} — submit for CD/ED review when ready</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white shrink-0"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Proposal details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block"><span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solar-Powered Grain Dryer v2" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block"><span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What will you build or change, for whom, and why?" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-y" />
              </label>
            </div>
            <label className="block">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)} className={cn('flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all', category === c ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{c}</button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timeline estimate</span>
              <input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder='e.g. 6 months (Sep 2026 – Feb 2027)' className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            </label>
            <div className="sm:col-span-2">
              <label className="block"><span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expected impact</span>
                <textarea value={expectedImpact} onChange={(e) => setExpectedImpact(e.target.value)} rows={2} placeholder="Who benefits and how — households, farmers, communities, systems…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-y" />
              </label>
            </div>
          </div>

          {/* Budget line items */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-aims-navy px-4 py-2.5 flex items-center justify-between">
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">payments</span>Budget Line Items</p>
              <button onClick={addLine} className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg hover:bg-white/30 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">add</span>Add line</button>
            </div>
            <div className="p-3 space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-300 text-[18px] shrink-0">{KIND_OPTIONS.find((k) => k.value === l.kind)?.icon}</span>
                  <select value={l.kind} onChange={(e) => setLine(i, { kind: e.target.value as ProjectBudgetLine['kind'] })} className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-aims-navy/30 shrink-0">
                    {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                  <input value={l.item} onChange={(e) => setLine(i, { item: e.target.value })} placeholder={l.kind === 'equipment' ? 'e.g. IoT sensor kit' : l.kind === 'software' ? 'e.g. analytics platform licence' : l.kind === 'personnel' ? 'e.g. field technician (3 months)' : 'e.g. transport, permits…'} className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-aims-navy/30" />
                  <div className="relative shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">UGX</span>
                    <input type="number" min={0} value={l.amount || ''} onChange={(e) => setLine(i, { amount: Number(e.target.value) || 0 })} placeholder="0" className="w-32 text-xs border border-slate-200 rounded-lg pl-10 pr-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-aims-navy/30 text-right" />
                  </div>
                  <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 shrink-0"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 italic">Budget estimate stays editable until approval — line items (equipment, software, personnel…) roll into the funding requisition once the project is In Progress.</p>
                <p className="text-xs font-extrabold text-slate-900">Total: UGX {total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[10px] text-slate-400 italic">{editing ? 'Revisions stay in "Changes Requested" — resubmit from the card.' : 'Save as draft · submit for CD/ED review from your dashboard.'}</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={save} disabled={!canSave} className={cn('px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors', canSave ? 'bg-aims-green text-white hover:bg-aims-green/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
              <span className="material-symbols-outlined text-[15px]">save</span>Save {editing ? 'Revision' : 'Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
