// src/components/finance/FinanceEditApprovals.tsx
// ============================================================
// AIMS — ED review of pending finance record changes.
// Finance submits edits to income/expense/budget records; nothing is
// applied until the ED approves here. The ED was notified immediately
// on submission.
// ============================================================

import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { financeService } from '@/services/financeService';

export function FinanceEditApprovals() {
  const { showToast, addNotification } = useNotifications();
  const [, setVersion] = useState(0);
  const pending = financeService.getPendingEdits().filter((e) => e.status === 'pending');
  const refresh = () => setVersion((v) => v + 1);

  const decide = (editId: string, decision: 'approve' | 'reject') => {
    const edit = decision === 'approve' ? financeService.approveEdit(editId) : financeService.rejectEdit(editId);
    if (!edit) return;
    addNotification({
      title: decision === 'approve' ? 'Finance Change Approved' : 'Finance Change Rejected',
      message: `${edit.label}: ${edit.oldValue} → ${edit.newValue} — ${decision === 'approve' ? 'approved by ED and applied' : 'rejected by ED'}.`,
      type: decision === 'approve' ? 'success' : 'warning',
      link: '/finance',
      actionUrl: '/finance',
    });
    showToast({
      title: decision === 'approve' ? 'Change Applied' : 'Change Rejected',
      message: `${edit.label} ${decision === 'approve' ? 'approved and applied to the records' : 'rejected — no change applied'}.`,
      type: decision === 'approve' ? 'success' : 'warning',
    });
    refresh();
  };

  if (pending.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-100 p-8 text-center">
        <span className="material-symbols-outlined text-[36px] text-slate-300">approval</span>
        <p className="text-sm font-bold text-slate-700 mt-2">No finance record changes pending</p>
        <p className="text-xs text-slate-400 mt-1">When Finance edits income, expenditure or budgets, the change appears here for your approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Finance can edit financial records, but changes apply <strong>only after your approval</strong>. You were notified on submission.</p>
      {pending.map((e) => (
        <div key={e.id} className="rounded-lg border border-aims-orange/30 bg-aims-orange/5 p-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{e.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {e.field}: <span className="line-through text-slate-400">{e.oldValue}</span> → <span className="font-extrabold text-aims-orange">{e.newValue}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Submitted by {e.submittedBy} · {new Date(e.submittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => decide(e.id, 'reject')} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-50 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">close</span>Reject
              </button>
              <button onClick={() => decide(e.id, 'approve')} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>Approve & Apply
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
