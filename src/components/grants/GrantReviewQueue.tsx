// src/components/grants/GrantReviewQueue.tsx
// ============================================================
// AIMS — ED Grant Review Queue
// Shows grants awaiting executive decision (submitted / under_review).
// ED: approve → Awarded | request changes → back to Drafting.
// CD: read-only oversight.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { GRANT_STAGES, formatCurrency, daysUntil, grantProgress, type GrantRecord } from '@/data/grants';
import { grantService } from '@/services/grantService';

export function GrantReviewQueue() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const navigate = useNavigate();
  const [grants, setGrants] = useState<GrantRecord[]>(() => grantService.getAllGrants());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!user) return null;
  const canDecide = user.role === 'ED';
  const queue = grants.filter((g) => g.stage === 'submitted' || g.stage === 'under_review');

  const handleDecision = (g: GrantRecord, decision: 'approve' | 'changes') => {
    const note = notes[g.id] ?? '';
    if (note.trim().length < 5) {
      showToast({ title: 'Note Required', message: 'Please add a decision note (min 5 chars).', type: 'error' });
      return;
    }
    const updated = grantService.edDecision(g.id, decision, note.trim(), user.name);
    if (updated) setGrants([...grantService.getAllGrants()]);
    if (decision === 'approve') {
      addNotification({ title: 'Grant Approved', message: `"${g.title}" was APPROVED. Ready for distribution.`, type: 'success', link: `/grants/${g.id}` });
      showToast({ title: 'Grant Approved', message: 'Writer has been notified.', type: 'success' });
    } else {
      addNotification({ title: 'Changes Requested', message: `ED requested changes on "${g.title}". Please revise and resubmit.`, type: 'warning', link: `/grants/${g.id}` });
      showToast({ title: 'Changes Requested', message: 'Grant returned to Drafting. Writer notified.', type: 'warning' });
    }
    setNotes((prev) => ({ ...prev, [g.id]: '' }));
    setExpandedId(null);
  };

  if (queue.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-100 p-8 text-center">
        <span className="material-symbols-outlined text-[36px] text-slate-300">task_alt</span>
        <p className="text-sm font-bold text-slate-700 mt-2">No grants awaiting your review</p>
        <p className="text-xs text-slate-400 mt-1">Submitted grants will appear here for approval or change requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((g) => {
        const days = daysUntil(g.deadline);
        const progress = grantProgress(g);
        const stageColor = GRANT_STAGES.find((s) => s.key === g.stage)?.color ?? 'navy';
        const isExpanded = expandedId === g.id;
        return (
          <div key={g.id} className={cn('rounded-lg border transition-all', isExpanded ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-center justify-between p-3 cursor-pointer flex-wrap gap-2" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{g.title}</p>
                  <p className="text-xs text-slate-500 truncate">{g.funder} • {formatCurrency(g.amountRequested)} • Handler: {g.handler}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', stageColor === 'red' ? 'bg-red-500 text-white' : 'bg-aims-navy/10 text-aims-navy')}>{g.stage.replace('_', ' ')}</span>
                <span className={cn('text-xs font-extrabold', days <= 7 ? 'text-aims-orange' : 'text-slate-600')}>{days}d</span>
              </div>
            </div>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Proposal Progress</span><span className="font-bold text-slate-900">{progress}%</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <button onClick={() => navigate(`/grants/${g.id}`)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>Open Full Detail
                  </button>
                </div>
                {canDecide && (
                  <div className="space-y-2">
                    <textarea
                      value={notes[g.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      placeholder="Decision note (required, min 5 chars) — visible to the writer…"
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleDecision(g, 'changes')} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">assignment_return</span>Request Changes
                      </button>
                      <button onClick={() => handleDecision(g, 'approve')} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>Approve → Awarded
                      </button>
                    </div>
                  </div>
                )}
                {!canDecide && <p className="text-[10px] text-slate-400 italic">Read-only oversight — only the ED can approve or request changes.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
