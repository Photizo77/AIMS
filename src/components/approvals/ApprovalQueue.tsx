// src/components/approvals/ApprovalQueue.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

interface ApprovalItem { id: string; type: 'requisition' | 'payslip'; title: string; description: string; amount: number; requestedBy: string; requestedByName: string; department: string; submittedAt: string; }

const MOCK_PENDING: ApprovalItem[] = [
  { id: 'ap1', type: 'requisition', title: 'Conference Travel Budget', description: 'Kampala innovation summit', amount: 4500000, requestedBy: 'u6', requestedByName: 'Pius Odong', department: 'Innovation', submittedAt: '2026-08-01' },
  { id: 'ap2', type: 'payslip', title: 'Payslip — Sarah Aciro', description: 'August 2026 payslip', amount: 1870000, requestedBy: 'u3', requestedByName: 'Grace Aceng', department: 'HR', submittedAt: '2026-08-03' },
];

export function ApprovalQueue() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [approvals, setApprovals] = useState<ApprovalItem[]>(MOCK_PENDING);
  const [rejectingItem, setRejectingItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // RESTRICTION: Only ED and CD can approve/reject financial transactions
  const canApprove = user?.role === 'ED' || user?.role === 'CD';

  const handleApprove = (item: ApprovalItem) => {
    setApprovals(prev => prev.filter(a => a.id !== item.id));
    addNotification({ userId: item.requestedBy, title: 'Approved', message: `"${item.title}" approved by ${user?.name}.`, type: 'success' });
    showToast({ title: 'Approved', message: `"${item.title}" approved.`, type: 'success' });
  };

  const handleRejectSubmit = () => {
    if (!rejectingItem || rejectReason.trim().length < 5) return;
    setApprovals(prev => prev.filter(a => a.id !== rejectingItem.id));
    addNotification({ userId: rejectingItem.requestedBy, title: 'Rejected', message: `"${rejectingItem.title}" rejected. Reason: ${rejectReason}`, type: 'error' });
    showToast({ title: 'Rejected', message: `"${rejectingItem.title}" rejected.`, type: 'warning' });
    setRejectingItem(null);
    setRejectReason('');
  };

  return (
    <div>
      <div className="mb-6"><h2 className="text-lg font-semibold text-slate-900">Pending Approvals</h2><p className="text-sm text-slate-500">{approvals.length} item(s) awaiting executive decision</p></div>
      {approvals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200"><span className="material-symbols-outlined text-[48px] text-aims-green block mb-2">check_circle</span><p className="text-slate-600 font-bold">All caught up!</p></div>
      ) : (
        <div className="space-y-4">
          {approvals.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.type === 'requisition' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{item.type}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm font-extrabold text-slate-900">UGX {item.amount.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">by {item.requestedByName}</span>
                  </div>
                </div>
                {canApprove && (
                  <div className="flex sm:flex-col gap-2">
                    <button onClick={() => handleApprove(item)} className="px-4 py-2 bg-aims-green text-white rounded-lg text-xs font-bold hover:opacity-90">Approve</button>
                    <button onClick={() => setRejectingItem(item)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100">Reject</button>
                  </div>
                )}
                {!canApprove && <span className="text-xs font-bold text-slate-400 italic">Awaiting ED/CD Approval</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRejectingItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject {rejectingItem.title}</h3>
            <p className="text-xs text-slate-500 mb-4">Please provide a mandatory reason for rejection so the requester can revise.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (minimum 5 characters)..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectingItem(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleRejectSubmit} disabled={rejectReason.trim().length < 5} className={cn('px-4 py-2 text-sm text-white rounded-lg font-bold', rejectReason.trim().length >= 5 ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-300 cursor-not-allowed')}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}