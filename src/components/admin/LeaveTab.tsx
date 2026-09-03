// src/components/admin/LeaveTab.tsx
// ============================================================
// AIMS — Leave & Absence Management (Company Admin / ED)
// Pending requests · approved · balances — all real, persisted
// through leaveService. Decisions update balances; ED can act on
// routed requests; "Request More Info" records a real follow-up.
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { leaveGet, decideLeave, requestMoreInfo, routeLeaveToED, fileLeaveRequest, type LeaveRequest } from '@/services/leaveService';
import { STAFF_ROSTER } from '@/data/roster';

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';
const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Study Leave', 'Unpaid Leave', 'Compassionate Leave'];

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-aims-orange/15 text-aims-orange',
  routed: 'bg-aims-navy/10 text-aims-navy',
  approved: 'bg-aims-green/15 text-aims-green',
  denied: 'bg-red-50 text-red-500',
};

export function LeaveTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [showFile, setShowFile] = useState(false);
  const [infoNote, setInfoNote] = useState<string | null>(null);
  useLiveData();

  const isED = user?.role === 'ED';
  const actor = user?.name ?? 'HR';

  const pending = leaveGet.pending();
  const approved = leaveGet.approved();
  const balances = leaveGet.balances();

  const act = (r: LeaveRequest, status: 'approved' | 'denied') => {
    decideLeave(r.id, status, actor);
    showToast({ title: status === 'approved' ? 'Leave Approved' : 'Leave Denied', message: `${r.name}'s ${r.type} ${status}.${status === 'approved' && !r.exceedsThreshold ? ' Balance updated.' : ''}`, type: status === 'approved' ? 'success' : 'warning' });
  };

  const askInfo = (r: LeaveRequest) => {
    setInfoNote(r.id);
  };
  const submitInfo = (r: LeaveRequest) => {
    requestMoreInfo(r.id);
    setInfoNote(null);
    showToast({ title: 'More Info Requested', message: `Follow-up requested from ${r.name} — badge shown until they respond.`, type: 'info' });
  };

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h3 className="text-base font-bold text-slate-900">Pending & Routed Requests</h3>
          <button onClick={() => setShowFile(true)} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_available</span>File Leave Request</button>
        </div>
        <div className="space-y-3">
          {pending.length === 0 && <p className="text-xs text-slate-400 italic">No pending leave requests.</p>}
          {pending.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.name} — {r.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.days} day(s) · {r.period}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Balance: <strong className={r.balance === 0 ? 'text-red-500' : 'text-slate-700'}>{r.balance} days</strong>{r.exceedsThreshold ? ' (over threshold)' : ''}{r.infoRequested ? ' · ℹ️ More info requested' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'routed' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">With ED</span>}
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', STATUS_STYLE[r.status])}>{r.status}</span>
                </div>
              </div>
              {(r.status === 'pending' || (r.status === 'routed' && isED)) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap items-center">
                  {((!isED && r.status === 'pending' && !r.exceedsThreshold) || isED) && (
                    <button onClick={() => act(r, 'approved')} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90">Approve</button>
                  )}
                  {((!isED && r.status === 'pending') || isED) && (
                    <button onClick={() => act(r, 'denied')} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100">Deny</button>
                  )}
                  {infoNote === r.id ? (
                    <button onClick={() => submitInfo(r)} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">✓ Log Info Request</button>
                  ) : (
                    <button onClick={() => askInfo(r)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">Request More Info</button>
                  )}
                  {!isED && r.status === 'pending' && (
                    <button onClick={() => { routeLeaveToED(r.id); showToast({ title: 'Routed to ED', message: `${r.name}'s request sent for ED review.`, type: 'success' }); }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">{r.exceedsThreshold ? 'Route to ED (Exceeds Threshold)' : 'Send to ED'}</button>
                  )}
                  <span className="text-[10px] text-slate-400 italic ml-auto">Decisions are recorded against your name.</span>
                </div>
              )}
              {r.status === 'routed' && !isED && <p className="text-[10px] text-slate-400 mt-2 italic">Routed to the ED for decision — visible in the ED queue.</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Approved (This Month)</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Days</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Period</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Approved By</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {approved.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.type}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.days}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.period}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.decidedBy ?? '—'}</td>
                </tr>
              ))}
              {approved.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400 italic">No approvals yet this month.</td></tr>}
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
              {balances.map((b) => (
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

      {/* File request modal */}
      {showFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowFile(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">File Leave Request</h3>
              <button onClick={() => setShowFile(false)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const req = fileLeaveRequest({ name: f.get('name') as string, type: f.get('type') as string, days: Number(f.get('days')) || 1, period: f.get('period') as string }); setShowFile(false); showToast({ title: req.status === 'approved' ? 'Leave Auto-Approved' : 'Leave Request Filed', message: `${req.name} ${req.status === 'approved' ? 'approved automatically (under 2 days).' : '— pending or routed for review.'}`, type: 'success' }); }} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label>
                <select name="name" required className={INPUT}><option value="">Select…</option>{STAFF_ROSTER.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label><select name="type" className={INPUT}>{LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Days</label><input name="days" type="number" min="1" max="30" defaultValue="1" className={INPUT} /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period</label><input name="period" required placeholder="e.g. Oct 5-6" className={INPUT} /></div>
              <p className="text-[10px] text-slate-400 italic">Under 2 days within balance auto-approve. Otherwise routed to the ED.</p>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowFile(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
