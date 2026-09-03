// src/components/admin/OffboardingTab.tsx
// ============================================================
// AIMS — Exit Management / Offboarding checklist (Company Admin)
// Real, persisted cases (offboardingService): ordered checklist
// with block enforcement, force-complete overrides, asset return,
// access revocation, account archiving and reminder comms.
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { sendEmail } from '@/lib/email';
import { STAFF_ROSTER } from '@/data/roster';
import { offboardGet, startOffboarding, advanceOffboardStep, advanceByLabel, logReminder, type Offboardee } from '@/services/offboardingService';

function stepCount(steps: { done: boolean }[]): { done: number; total: number; pct: number } {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
}

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';

export function OffboardingTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [showStart, setShowStart] = useState(false);
  useLiveData();
  const cases = offboardGet.cases();

  const actor = user?.name ?? 'HR';

  const complete = (c: Offboardee, label: string, force = false) => {
    const res = advanceByLabel(c.id, label, actor, force);
    if (res === 'blocked') showToast({ title: 'Step Blocked', message: `"${label}" awaits its preceding step first.`, type: 'warning' });
    else if (res === 'ok') showToast({ title: 'Step Completed', message: `${label} recorded for ${c.name}.`, type: 'success' });
  };

  const resendReminder = async (c: Offboardee) => {
    logReminder(c.id);
    const staff = STAFF_ROSTER.find((s) => s.name === c.name);
    if (staff) {
      const res = await sendEmail({ to: staff.email, subject: 'ARDHI — Asset Return Reminder', body: `Dear ${c.name}, please return all ARDHI assets assigned to you before your exit date (${c.exitDate}). Thank you.` });
      showToast({ title: 'Reminder Sent', message: res.mode === 'smtp' ? `Delivered to ${staff.email}.` : `Queued for ${staff.email} (local mode until SMTP is configured).`, type: 'success' });
    } else {
      showToast({ title: 'Reminder Logged', message: `Reminder recorded for ${c.name} (no mailbox on file).`, type: 'info' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-bold text-slate-700">Employees Exiting: <span className="text-aims-orange">{cases.length}</span></p>
        <button onClick={() => setShowStart(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">person_remove</span>Start Offboarding
        </button>
      </div>
      {cases.map((ob) => {
        const { done, total, pct } = stepCount(ob.steps);
        const remaining = total - done;
        return (
          <div key={ob.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-aims-orange text-white flex items-center justify-center font-bold text-sm">{ob.name[0]}</div>
                <div>
                  <p className="text-base font-extrabold text-slate-900">{ob.name}</p>
                  <p className="text-xs text-slate-500">Exit Date: {ob.exitDate} · {ob.role} ({ob.dept}){ob.exitType ? ` · ${ob.exitType}` : ''}</p>
                  {(ob.reason || ob.handoverTo) && <p className="text-[10px] text-slate-400 mt-0.5">{ob.reason ? `Reason: ${ob.reason}` : ''}{ob.handoverTo ? ` · Handover to: ${ob.handoverTo}` : ''}</p>}
                </div>
              </div>
              <div className="w-36"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Timeline</span><span className="font-bold text-slate-900">{done}/{total} ({pct}%)</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-orange" style={{ width: `${pct}%` }} /></div></div>
            </div>
            <div className="space-y-2">
              {ob.steps.map((s) => (
                <div key={s.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', s.done ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', s.done ? 'bg-aims-green text-white' : 'bg-slate-200 text-slate-500')}>
                    <span className="material-symbols-outlined text-[14px]">{s.done ? 'check' : s.blockedBy ? 'lock' : 'circle'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', s.done ? 'text-slate-500 line-through' : 'text-slate-900')}>{s.label}</p>
                    {s.detail && <p className="text-[10px] text-slate-500 mt-0.5">{s.detail}</p>}
                    {s.done && s.completedBy && <p className="text-[10px] text-aims-green mt-0.5">✓ Completed by {s.completedBy}</p>}
                    {!s.done && s.blockedBy && <p className="text-[10px] font-bold text-aims-orange mt-0.5">Blocked — awaits "{s.blockedBy}"</p>}
                  </div>
                  {!s.done && (
                    <button onClick={() => { const res = advanceOffboardStep(ob.id, s.id, actor, Boolean(s.blockedBy)); if (res === 'ok') showToast({ title: 'Step Completed', message: `${s.label} recorded.`, type: 'success' }); else if (res === 'blocked') showToast({ title: 'Step Blocked', message: `"${s.label}" awaits "${s.blockedBy}".`, type: 'warning' }); }} className="text-[10px] font-bold text-aims-navy hover:underline shrink-0">{s.blockedBy ? 'Force Complete' : 'Mark Complete'}</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 flex-wrap items-center">
              <button onClick={() => complete(ob, 'Asset Return')} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90">Confirm Asset Return</button>
              <button onClick={() => complete(ob, 'Access Revocation')} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">Revoke Access</button>
              <button onClick={() => complete(ob, 'Final Deactivation')} className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800">Archive Account</button>
              <button onClick={() => resendReminder(ob)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">Resend Asset Return Reminder</button>
              {remaining === 0 && <span className="text-[10px] font-bold text-aims-green ml-auto">✓ Offboarding complete</span>}
            </div>
          </div>
        );
      })}
      {cases.length === 0 && <p className="text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl p-6 text-center">No active offboarding cases.</p>}

      {/* Start Offboarding modal */}
      {showStart && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowStart(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Start Offboarding</h3>
              <button onClick={() => setShowStart(false)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const c = startOffboarding({ name: f.get('name') as string, exitDate: f.get('exitDate') as string, exitType: f.get('exitType') as string || undefined, lastWorkingDay: f.get('lastWorkingDay') as string || undefined, noticeDays: Number(f.get('noticeDays')) || undefined, reason: f.get('reason') as string || undefined, handoverTo: f.get('handoverTo') as string || undefined, settlementNotes: f.get('settlementNotes') as string || undefined }); setShowStart(false); showToast({ title: 'Offboarding Started', message: `Exit checklist created for ${c.name}.`, type: 'success' }); }} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Section A — employee & exit */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">1 · Employee & Exit Details</p></div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee *</label>
                    <select name="name" required className={INPUT}>
                      <option value="">Select employee…</option>
                      {STAFF_ROSTER.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.name}>{s.name} — {s.position}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exit Type</label>
                    <select name="exitType" className={INPUT}><option value="">Select…</option><option>Resignation</option><option>Retirement</option><option>Contract End</option><option>Redundancy</option><option>Termination</option><option>Mutual Agreement</option></select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notice Period (days)</label>
                    <input name="noticeDays" type="number" min="0" className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exit Date *</label>
                    <input name="exitDate" type="date" required className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Last Working Day</label>
                    <input name="lastWorkingDay" type="date" className={INPUT} />
                  </div>
                </div>
              </div>

              {/* Section B — reason & handover */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">2 · Reason & Handover</p></div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Exit</label>
                    <textarea name="reason" rows={2} placeholder="Brief, factual reason for the exit…" className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Handover To (role/responsibilities)</label>
                    <input name="handoverTo" placeholder="e.g. Janet Apio — Grants portfolio" className={INPUT} />
                  </div>
                </div>
              </div>

              {/* Section C — settlement notes */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">3 · Settlement Notes</p></div>
                <div className="p-4">
                  <textarea name="settlementNotes" rows={3} placeholder="Final payslip, accrued leave payout, benefits, debts…" className={INPUT} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowStart(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Create Exit Checklist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
