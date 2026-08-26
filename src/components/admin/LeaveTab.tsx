// src/components/admin/LeaveTab.tsx
// ============================================================
// AIMS — Leave & Absence Management (Company Admin)
// Pending requests · approved · balances. Minor leave (<2 days)
// auto-approves; longer leave routes to the ED.
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  name: string;
  type: string;
  days: number;
  period: string;
  balance: number;
  status: 'pending' | 'approved' | 'denied' | 'routed';
  exceedsThreshold?: boolean;
}

const MOCK_PENDING: LeaveRequest[] = [
  { id: 'l1', name: 'Sarah Aciro', type: 'Annual Leave', days: 2, period: 'Sep 25-26', balance: 12, status: 'pending' },
  { id: 'l2', name: 'Florence Adong', type: 'Sick Leave', days: 1, period: 'Sep 30', balance: 8, status: 'pending' },
  { id: 'l3', name: 'Janet Apio', type: 'Unpaid Leave', days: 3, period: 'Oct 1-3', balance: 0, status: 'pending', exceedsThreshold: true },
];

const MOCK_APPROVED: LeaveRequest[] = [
  { id: 'l4', name: 'Peter Byamugisha', type: 'Annual Leave', days: 10, period: 'Sep 10-20', balance: 4, status: 'approved' },
  { id: 'l5', name: 'Isaac Tumusiime', type: 'Study Leave', days: 1, period: 'Sep 15', balance: 2, status: 'approved' },
];

const MOCK_BALANCES: { name: string; annual: number; sick: number; study: number }[] = [
  { name: 'Sarah Aciro', annual: 12, sick: 8, study: 2 },
  { name: 'Florence Adong', annual: 14, sick: 6, study: 1 },
  { name: 'Grace Nakamya', annual: 8, sick: 7, study: 0 },
  { name: 'Janet Apio', annual: 0, sick: 5, study: 1 },
  { name: 'Isaac Tumusiime', annual: 6, sick: 4, study: 2 },
  { name: 'Pius Odong', annual: 10, sick: 6, study: 3 },
];

export function LeaveTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [pending, setPending] = useState(MOCK_PENDING);
  const isED = user?.role === 'ED';

  const notify = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') =>
    showToast({ title, message, type });

  const act = (id: string, nextStatus: LeaveRequest['status'], msg: string) => {
    setPending((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
    notify(nextStatus === 'approved' ? 'Leave Approved' : nextStatus === 'denied' ? 'Leave Denied' : 'Routed to ED', msg, nextStatus === 'denied' ? 'warning' : 'success');
  };

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Pending Requests</h3>
        <div className="space-y-3">
          {pending.length === 0 && <p className="text-xs text-slate-400 italic">No pending leave requests.</p>}
          {pending.map((r) => (
            <div key={r.id} className={cn('rounded-lg border p-4', r.status === 'pending' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100')}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.name} — {r.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.days} day(s) · {r.period}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Available balance: <strong className={r.balance === 0 ? 'text-red-500' : 'text-slate-700'}>{r.balance} days</strong>{r.exceedsThreshold ? ' (requesting unpaid — exceeds threshold)' : ''}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'pending' ? 'bg-aims-orange/15 text-aims-orange' : r.status === 'approved' ? 'bg-aims-green/15 text-aims-green' : r.status === 'routed' ? 'bg-aims-navy/10 text-aims-navy' : 'bg-red-50 text-red-500')}>{r.status.replace('_', ' ')}</span>
              </div>
              {r.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                  <button onClick={() => act(r.id, 'approved', `${r.name}'s ${r.type} approved.`)} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90">{isED ? 'Approve' : r.days < 2 ? 'Approve (Quick)' : 'Approve'}</button>
                  <button onClick={() => notify('More Info Requested', `Additional information requested from ${r.name}.`, 'info')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">Request More Info</button>
                  <button onClick={() => act(r.id, 'denied', `${r.name}'s leave request denied.`)} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100">Deny</button>
                  {!isED && (r.exceedsThreshold ? (
                    <button onClick={() => act(r.id, 'routed', `${r.name}'s request routed to ED (exceeds 2-day threshold).`)} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">Route to ED (Exceeds Threshold)</button>
                  ) : (
                    <button onClick={() => act(r.id, 'routed', `${r.name}'s request sent to ED for review.`)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">Send to ED</button>
                  ))}
                  {isED && r.exceedsThreshold && <span className="text-[10px] font-bold text-aims-navy bg-aims-navy/5 px-2 py-1 rounded self-center">ED decision required</span>}
                </div>
              )}
              {r.status !== 'pending' && <p className="text-[10px] text-slate-400 mt-2 italic">Decision recorded: {r.status.replace('_', ' ')}.</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Approved this month */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Approved (This Month)</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Days</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Period</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_APPROVED.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.type}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.days}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.period}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-green/15 text-aims-green uppercase">Approved</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balances */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Leave Balances (All Employees)</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Annual</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Sick</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Study</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_BALANCES.map((b) => (
                <tr key={b.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{b.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{b.annual} days</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{b.sick} days</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{b.study} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
