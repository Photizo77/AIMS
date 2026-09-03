// src/components/admin/AttendanceManagement.tsx
// ============================================================
// AIMS — Company-wide Attendance Management (Company Admin / ED)
// Real-Time Presence · Historical Records · Leave & Absence ·
// Anomalies & Violations · Punctuality Analytics
// All data comes from the persisted attendance register
// (attendanceService); every action is a real mutation.
// ============================================================

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { exportCsv, exportTableAsPdf } from '@/lib/export';
import { sendEmail } from '@/lib/email';
import {
  attendanceGet, markAbsence, resolveViolation, resolveAnomaly, sendReminder,
  staffEmails,
} from '@/services/attendanceService';
import { LeaveTab } from './LeaveTab';

type TabKey = 'presence' | 'historical' | 'leave' | 'anomalies' | 'punctuality';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'presence', label: 'Real-Time Presence', icon: 'sensors' },
  { id: 'historical', label: 'Historical Records', icon: 'calendar_month' },
  { id: 'leave', label: 'Leave & Absence', icon: 'event_available' },
  { id: 'anomalies', label: 'Anomalies & Violations', icon: 'warning' },
  { id: 'punctuality', label: 'Punctuality Analytics', icon: 'speed' },
];

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function AttendanceManagement() {
  const location = useLocation();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const t = (location.state as { tab?: string } | null)?.tab;
    return (t === 'anomalies' || t === 'presence' || t === 'historical' || t === 'leave' || t === 'punctuality' ? t : 'presence') as TabKey;
  });
  const [deptFilter, setDeptFilter] = useState('all');
  const [showMarkAbsence, setShowMarkAbsence] = useState(false);
  const [actOnViolation, setActOnViolation] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('');
  useLiveData();

  const presence = attendanceGet.presence();
  const history = attendanceGet.history();
  const violations = attendanceGet.violations();
  const anomalies = attendanceGet.anomalies();
  const counts = attendanceGet.counts();
  const depts = ['all', ...Array.from(new Set(presence.map((p) => p.dept)))];
  const visiblePresence = presence.filter((p) => (deptFilter === 'all' || p.dept === deptFilter) && (!employeeFilter || p.name.toLowerCase().includes(employeeFilter.toLowerCase())));
  const visibleHistory = history
    .filter((h) => (deptFilter === 'all' || h.dept === deptFilter) && (!employeeFilter || h.name.toLowerCase().includes(employeeFilter.toLowerCase())))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const openViolations = violations.filter((v) => !v.resolved);
  const activeAnomalies = anomalies.filter((a) => !a.resolved);

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const exportPresence = (fmt: 'csv' | 'pdf') => {
    if (visiblePresence.length === 0) { showToast({ title: 'Nothing to Export', message: 'No presence rows match your filters.', type: 'error' }); return; }
    const rows = visiblePresence.map((p) => ({ employee: p.name, department: p.dept, checkIn: p.checkIn, type: p.mode, note: p.note ?? p.location }));
    if (fmt === 'csv') { exportCsv('aims-attendance-presence', rows); showToast({ title: 'CSV Exported', message: `${rows.length} row(s).`, type: 'success' }); }
    else { exportTableAsPdf('Attendance — Presence Report', ['Employee', 'Department', 'Check In', 'Type', 'Location/Note'], rows.map((r) => Object.values(r) as string[])); showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' }); }
  };

  const exportHistory = (fmt: 'csv' | 'pdf') => {
    if (visibleHistory.length === 0) { showToast({ title: 'Nothing to Export', message: 'No historical rows match your filters.', type: 'error' }); return; }
    const rows = visibleHistory.map((h) => ({ employee: h.name, department: h.dept, date: fmtDate(h.date), checkIn: h.checkIn, checkOut: h.checkOut, type: h.mode, status: h.status }));
    if (fmt === 'csv') { exportCsv('aims-attendance-history', rows); showToast({ title: 'CSV Exported', message: `${rows.length} record(s).`, type: 'success' }); }
    else { exportTableAsPdf('Attendance — Historical Records', ['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Type', 'Status'], rows.map((r) => Object.values(r) as string[])); showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' }); }
  };

  const submitReminder = async (subject: string, body: string) => {
    sendReminder(subject, body);
    const emails = staffEmails();
    const results = await Promise.allSettled(emails.map((to) => sendEmail({ to, subject, body })));
    const smtp = results.filter((r) => r.status === 'fulfilled' && (r.value as { mode?: string }).mode === 'smtp').length;
    showToast({ title: 'Reminder Sent', message: smtp > 0 ? `Delivered via SMTP to ${smtp} staff.` : `Queued for ${emails.length} staff (local mode until SMTP is configured).`, type: 'success' });
  };

  const punctuality = (() => {
    const map = new Map<string, { on: number; late: number }>();
    history.forEach((h) => {
      const cur = map.get(h.staffId) ?? { on: 0, late: 0 };
      if (h.status === 'late' || h.status === 'absent') cur.late += 1; else cur.on += 1;
      map.set(h.staffId, cur);
    });
    return Array.from(map.entries())
      .map(([staffId, c]) => ({ name: history.find((h) => h.staffId === staffId)?.name ?? staffId, pct: Math.round((c.on / Math.max(1, c.on + c.late)) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
  })();

  const deptTrends = (() => {
    const map = new Map<string, { on: number; total: number }>();
    history.forEach((h) => {
      const cur = map.get(h.dept) ?? { on: 0, total: 0 };
      cur.total += 1;
      if (h.status !== 'late' && h.status !== 'absent') cur.on += 1;
      map.set(h.dept, cur);
    });
    return Array.from(map.entries()).map(([dept, c]) => ({ dept, pct: Math.round((c.on / Math.max(1, c.total)) * 100) }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── REAL-TIME PRESENCE ── */}
      {activeTab === 'presence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-bold text-slate-700">Current Time: <span className="text-aims-navy">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></p>
            <div className="flex gap-2 flex-wrap">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2">{depts.map((d) => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}</select>
              <button onClick={() => exportPresence('pdf')} className="px-3 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Export Presence PDF</button>
              <button onClick={() => exportPresence('csv')} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Export CSV</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-aims-green/5 border border-aims-green/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-green">{counts.physical}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Physical (geofenced)</p></div>
            <div className="p-3 bg-aims-navy/5 border border-aims-navy/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-navy">{counts.remote}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Remote</p></div>
            <div className="p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-orange">{counts.absent}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Absent</p></div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center"><p className="text-2xl font-extrabold text-slate-600">{counts.leave}</p><p className="text-[10px] font-bold text-slate-500 uppercase">On Leave</p></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Location / Note</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePresence.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{p.dept}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">{p.checkIn}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', p.mode === 'physical' ? 'bg-aims-green/15 text-aims-green' : p.mode === 'remote' ? 'bg-aims-navy/10 text-aims-navy' : p.mode === 'absent' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500')}>{p.mode}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{p.note || p.location}</td>
                  </tr>
                ))}
                {visiblePresence.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400 italic">No employees match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HISTORICAL RECORDS ── */}
      {activeTab === 'historical' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-2 items-end">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label><select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2">{depts.map((d) => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label><input type="text" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} placeholder="Filter by name…" className="text-xs border border-slate-200 rounded-lg px-3 py-2" /></div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button onClick={() => exportHistory('csv')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">CSV Export</button>
              <button onClick={() => exportHistory('pdf')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">PDF Export</button>
              <button onClick={() => setShowMarkAbsence(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Mark Absence</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check Out</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleHistory.slice(0, 60).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">{r.checkIn}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">{r.checkOut}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{r.mode}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'present' ? 'bg-aims-green/15 text-aims-green' : r.status === 'late' ? 'bg-aims-orange/15 text-aims-orange' : r.status === 'leave' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500')}>{r.status}</span></td>
                  </tr>
                ))}
                {visibleHistory.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400 italic">No records match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEAVE & ABSENCE ── */}
      {activeTab === 'leave' && <LeaveTab />}

      {/* ── ANOMALIES & VIOLATIONS ── */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Geofence Violations (Failed physical check-ins)</h3>
            <div className="space-y-3">
              {openViolations.map((v) => (
                <div key={v.id} className="bg-white rounded-lg border border-red-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-[18px]">gps_off</span>{v.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.ts} · Attempted from: {v.attempted} ({v.distance})</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{v.note}</p>
                      {v.recurring && <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500 uppercase">Flag: Recurring</span>}
                    </div>
                    <button onClick={() => setActOnViolation(v.id)} className="text-[10px] font-bold text-aims-navy hover:underline">Take Action</button>
                  </div>
                </div>
              ))}
              {openViolations.length === 0 && <p className="text-xs text-slate-400 italic bg-white border border-slate-200 rounded-lg p-6 text-center">No open geofence violations.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Attendance Anomalies (Pattern detection)</h3>
            <div className="space-y-2">
              {activeAnomalies.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-aims-orange text-[18px]">monitoring</span>
                    <div><p className="text-sm font-bold text-slate-900">{a.name}</p><p className="text-xs text-slate-500">{a.detail}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', a.severity === 'high' ? 'bg-red-50 text-red-500' : 'bg-aims-orange/15 text-aims-orange')}>{a.severity}</span>
                    <button onClick={() => { resolveAnomaly(a.id); showToast({ title: 'Anomaly Resolved', message: `${a.name} reviewed and closed.`, type: 'success' }); }} className="text-[10px] font-bold text-aims-navy hover:underline">Resolve</button>
                  </div>
                </div>
              ))}
              {activeAnomalies.length === 0 && <p className="text-xs text-slate-400 italic bg-white border border-slate-200 rounded-lg p-6 text-center">No open anomalies.</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowReminder(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Send Reminder Comms</button>
          </div>
        </div>
      )}

      {/* ── PUNCTUALITY ANALYTICS ── */}
      {activeTab === 'punctuality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">On-Time Leaderboard (Recent records)</h3>
            <div className="space-y-3">
              {punctuality.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5"><span className="font-bold text-slate-800">{p.name}</span><span className={cn('font-extrabold', p.pct < 80 ? 'text-aims-orange' : 'text-aims-green')}>{p.pct}% on time{p.pct < 80 ? ' ⚠️' : ''}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className={cn('h-1.5 rounded-full', p.pct < 80 ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${p.pct}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Department Punctuality</h3>
            <div className="space-y-4">
              {deptTrends.map((d) => (
                <div key={d.dept}>
                  <div className="flex justify-between text-xs mb-0.5"><span className="font-bold text-slate-800">{d.dept}</span><span className={cn('font-extrabold', d.pct < 85 ? 'text-red-500' : 'text-aims-green')}>{d.pct}% punctuality{d.pct < 85 ? ' ⚠️' : ''}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', d.pct < 85 ? 'bg-red-400' : 'bg-aims-green')} style={{ width: `${d.pct}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4">Computed live from the attendance register. Consider reminder comms for departments below 85%.</p>
          </div>
        </div>
      )}

      {/* ── Mark Absence Modal ── */}
      {showMarkAbsence && (
        <Modal title="Mark Absence" onClose={() => setShowMarkAbsence(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const id = f.get('employee') as string; markAbsence(id, (f.get('note') as string) || ''); setShowMarkAbsence(false); const n = presence.find((p) => p.id === id)?.name ?? 'Employee'; showToast({ title: 'Absence Marked', message: `${n} marked absent for today.`, type: 'success' }); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label><select name="employee" required className={INPUT}>{presence.filter((p) => p.mode !== 'leave').map((p) => <option key={p.id} value={p.id}>{p.name} — {p.dept} ({p.mode})</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason / Note</label><textarea name="note" rows={2} placeholder="e.g. Sick leave — doctor's note attached" className={INPUT} /></div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowMarkAbsence(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Mark Absent</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Take Action (violation) Modal ── */}
      {actOnViolation && (() => {
        const v = violations.find((x) => x.id === actOnViolation);
        if (!v) return null;
        return (
          <Modal title={`Resolve Violation — ${v.name}`} onClose={() => setActOnViolation(null)}>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); resolveViolation(v.id, (f.get('action') as string) || 'Resolved'); setActOnViolation(null); showToast({ title: 'Action Recorded', message: `${v.name}'s violation resolved.`, type: 'success' }); }} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">{v.ts} · {v.distance} · {v.note}</div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution Action</label><textarea name="action" rows={2} required placeholder="e.g. Verified location; marked as approved remote day" className={INPUT} /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setActOnViolation(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Save Resolution</button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* ── Send Reminder Modal ── */}
      {showReminder && (
        <Modal title="Send Reminder Comms" onClose={() => setShowReminder(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); submitReminder((f.get('subject') as string) || 'Attendance Reminder', (f.get('body') as string) || 'Please follow the check-in procedure.'); setShowReminder(false); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label><input name="subject" required defaultValue="Attendance — Check-in Reminder" className={INPUT} /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message</label><textarea name="body" rows={3} required placeholder="Message to all active staff…" className={INPUT} /></div>
            <p className="text-[10px] text-slate-400 italic">Sent to {staffEmails().length} active staff members and logged in the register.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowReminder(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Send Reminder</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
