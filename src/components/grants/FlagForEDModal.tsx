// src/components/grants/FlagForEDModal.tsx
// ============================================================
// AIMS — Flag for ED modal (CD's signature intervention).
// Available from any module where the CD has view access. Attaches a note
// to the specific record and routes it to the ED's Approvals Queue as a
// priority interrupt, tagged with the CD's name and timestamp.
// ============================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { flagService } from '@/services/flagService';

export interface FlagTarget {
  recordLabel: string;
  sourceModule: string;
}

/** Programmatically open the flag modal (used across modules) */
export function openFlagForED(target: FlagTarget): void {
  window.dispatchEvent(new CustomEvent('aims:flag-for-ed', { detail: target }));
}

export function FlagForEDModal() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [target, setTarget] = useState<FlagTarget | null>(null);
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'normal'>('normal');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FlagTarget>).detail;
      setTarget(detail);
      setNote('');
      setPriority('normal');
    };
    window.addEventListener('aims:flag-for-ed', handler);
    return () => window.removeEventListener('aims:flag-for-ed', handler);
  }, []);

  const submit = () => {
    if (!target || !note.trim()) return;
    const flag = flagService.raiseFlag(target.recordLabel, target.sourceModule, note.trim(), user?.name ?? 'Country Director', priority);
    addNotification({
      userId: 'user-ed-001',
      title: `${flag.priority === 'urgent' ? '🚩 URGENT ' : ''}CD Flag — ${target.sourceModule}`,
      message: `${flag.raisedBy}: "${note.trim()}" (on: ${target.recordLabel})`,
      type: 'approval',
      link: '/approvals',
      actionUrl: '/approvals',
    });
    showToast({ title: 'Flag Raised', message: 'Routed to ED\'s Approvals Queue as a priority interrupt.', type: 'success' });
    setTarget(null);
  };

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setTarget(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-aims-orange text-[22px]">flag</span>Flag for ED
          </h3>
          <button onClick={() => setTarget(null)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>
        <p className="text-sm text-slate-600 mb-1">Attached to: <strong className="text-slate-900">{target.recordLabel}</strong></p>
        <p className="text-[10px] text-slate-400 mb-4">Routes to ED's Approvals Queue · tagged with your name and timestamp · ED resolves it.</p>

        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setPriority('urgent')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-300' : 'bg-white text-slate-500 border-slate-200')}>🚩 Urgent</button>
          <button onClick={() => setPriority('normal')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', priority === 'normal' ? 'bg-aims-orange/10 text-aims-orange border-aims-orange/30' : 'bg-white text-slate-500 border-slate-200')}>Normal</button>
        </div>

        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Note for ED</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Describe the concern and what you want the ED to review…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" />

        <div className="flex justify-end gap-2">
          <button onClick={() => setTarget(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
          <button onClick={submit} disabled={!note.trim()} className={cn('px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5', note.trim() ? 'bg-aims-orange text-white hover:bg-aims-orange/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
            <span className="material-symbols-outlined text-[16px]">flag</span>Raise Flag for ED
          </button>
        </div>
      </div>
    </div>
  );
}
