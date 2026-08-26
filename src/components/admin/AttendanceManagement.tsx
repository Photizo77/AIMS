// src/components/admin/AttendanceManagement.tsx
// ============================================================
// AIMS — Company-wide Attendance Management (Company Admin)
// Real-Time Presence · Historical Records · Leave & Absence ·
// Anomalies & Violations · Punctuality Analytics
// ============================================================

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { LeaveTab } from './LeaveTab';

type TabKey = 'presence' | 'historical' | 'leave' | 'anomalies' | 'punctuality';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'presence', label: 'Real-Time Presence', icon: 'sensors' },
  { id: 'historical', label: 'Historical Records', icon: 'calendar_month' },
  { id: 'leave', label: 'Leave & Absence', icon: 'event_available' },
  { id: 'anomalies', label: 'Anomalies & Violations', icon: 'warning' },
  { id: 'punctuality', label: 'Punctuality Analytics', icon: 'speed' },
];

interface PresenceRow {
  id: string;
  name: string;
  dept: string;
  checkIn: string;
  mode: 'physical' | 'remote' | 'absent' | 'leave';
  location: string;
  note?: string;
}

const MOCK_PRESENCE: PresenceRow[] = [
  { id: 'p1', name: 'Sarah Aciro', dept: 'Development', checkIn: '09:12 AM', mode: 'physical', location: 'Office (geofenced)' },
  { id: 'p2', name: 'Florence Adong', dept: 'Research', checkIn: '09:28 AM', mode: 'physical', location: 'Office (geofenced)' },
  { id: 'p3', name: 'Grace Nakamya', dept: 'Administration', checkIn: '08:58 AM', mode: 'physical', location: 'Office (geofenced)' },
  { id: 'p4', name: 'Isaac Tumusiime', dept: 'Finance', checkIn: '—', mode: 'absent', location: '—', note: 'Alert: Late — not yet checked in' },
  { id: 'p5', name: 'Janet Apio', dept: 'Operations', checkIn: '08:30 AM', mode: 'remote', location: 'Remote — Kampala' },
  { id: 'p6', name: 'Pius Odong', dept: 'Innovation', checkIn: '08:15 AM', mode: 'remote', location: 'Remote — Home' },
  { id: 'p7', name: 'Okello Komakech', dept: 'IT', checkIn: '—', mode: 'leave', location: '—', note: 'Exit Date (Sep 30)' },
  { id: 'p8', name: 'Peter Byamugisha', dept: 'Executive', checkIn: '—', mode: 'leave', location: '—', note: 'On Annual Leave (Sep 10-20)' },
];

interface GeofenceViolation { id: string; name: string; ts: string; expected: string; attempted: string; distance: string; action: string; recurring?: boolean }
const MOCK_VIOLATIONS: GeofenceViolation[] = [
  { id: 'v1', name: 'Isaac Tumusiime', ts: 'Sep 30, 09:30 AM', expected: 'Office (geofenced)', attempted: 'GPS 1.2456°S, 36.7891°E', distance: '2km away', action: 'Manual check-in submitted 09:45 AM', recurring: true },
  { id: 'v2', name: 'Florence Adong', ts: 'Sep 29, 08:55 AM', expected: 'Office (geofenced)', attempted: 'GPS 1.3012°S, 36.8123°E', distance: '5km away', action: 'No check-in recorded (marked absent)' },
];

const MOCK_ANOMALIES = [
  { id: 'an1', name: 'Isaac Tumusiime', detail: 'Recurring lateness — 8 times this month', severity: 'high' },
  { id: 'an2', name: 'Sarah Aciro', detail: 'Remote check-ins 40% of month (role is office-based)', severity: 'medium' },
  { id: 'an3', name: 'Finance department', detail: 'Late arrivals up 60% week-on-week', severity: 'high' },
];

const MOCK_PUNCTUALITY = [
  { name: 'Grace Nakamya', pct: 100, rank: 1 },
  { name: 'Florence Adong', pct: 92, rank: 2 },
  { name: 'Sarah Aciro', pct: 88, rank: 3 },
  { name: 'Janet Apio', pct: 82, rank: 4 },
  { name: 'Isaac Tumusiime', pct: 65, rank: 5, flag: true },
];

const MOCK_DEPT_TRENDS = [
  { dept: 'Development', pct: 94, trend: 'stable' },
  { dept: 'Operations', pct: 87, trend: 'stable' },
  { dept: 'Finance', pct: 81, trend: 'down' },
];

export function AttendanceManagement() {
  const location = useLocation();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const t = (location.state as { tab?: string } | null)?.tab;
    return (t === 'anomalies' || t === 'presence' || t === 'historical' || t === 'leave' || t === 'punctuality' ? t : 'presence') as TabKey;
  });
  const [deptFilter, setDeptFilter] = useState('all');

  const notify = (title: string, message: string) => showToast({ title, message, type: 'success' });

  const filteredPresence = MOCK_PRESENCE.filter((p) => deptFilter === 'all' || p.dept === deptFilter);
  const physical = MOCK_PRESENCE.filter((p) => p.mode === 'physical').length;
  const remote = MOCK_PRESENCE.filter((p) => p.mode === 'remote').length;
  const absentOrLeave = MOCK_PRESENCE.filter((p) => p.mode === 'absent' || p.mode === 'leave').length;

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
            <p className="text-sm font-bold text-slate-700">Current Time: <span className="text-aims-navy">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> · Last Updated: 1 minute ago</p>
            <div className="flex gap-2">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2">
                <option value="all">All departments</option>
                {['Development', 'Research', 'Administration', 'Finance', 'Operations', 'Innovation', 'IT', 'Executive'].map((d) => <option key={d}>{d}</option>)}
              </select>
              <button onClick={() => notify('Presence Exported', 'Presence report exported (PDF).')} className="px-3 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Export Presence Report</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-aims-green/5 border border-aims-green/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-green">{physical}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Physical (geofenced)</p></div>
            <div className="p-3 bg-aims-navy/5 border border-aims-navy/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-navy">{remote}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Remote</p></div>
            <div className="p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg text-center"><p className="text-2xl font-extrabold text-aims-orange">{absentOrLeave}</p><p className="text-[10px] font-bold text-slate-500 uppercase">Absent / On Leave</p></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Location / Note</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPresence.map((p) => (
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HISTORICAL RECORDS ── */}
      {activeTab === 'historical' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-2 items-end">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Range</label><input type="text" defaultValue="Sep 1 - Sep 30" className="text-xs border border-slate-200 rounded-lg px-3 py-2" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label><input type="text" placeholder="All employees" className="text-xs border border-slate-200 rounded-lg px-3 py-2" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label><select className="text-xs border border-slate-200 rounded-lg px-3 py-2"><option>All</option></select></div>
            <button onClick={() => notify('Records Exported', 'Historical records exported (CSV + PDF).')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">CSV/PDF Export</button>
            <button onClick={() => notify('Absence Marked', 'Absence record created for selected employee.')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Mark Absence</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Check Out</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Sarah Aciro', date: 'Sep 30', ci: '09:05 AM', co: '05:30 PM', type: 'Physical', status: 'present' },
                  { name: 'Sarah Aciro', date: 'Sep 29', ci: '09:12 AM', co: '04:45 PM', type: 'Physical', status: 'present' },
                  { name: 'Florence Adong', date: 'Sep 30', ci: '08:50 AM', co: '05:00 PM', type: 'Physical', status: 'present' },
                  { name: 'Florence Adong', date: 'Sep 30 (home)', ci: '08:00 AM', co: '05:15 PM', type: 'Remote', status: 'present' },
                  { name: 'Isaac Tumusiime', date: 'Sep 30', ci: '—', co: '—', type: '—', status: 'late' },
                  { name: 'Okello Komakech', date: 'Sep 30', ci: '—', co: '—', type: '—', status: 'leave' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{r.date}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">{r.ci}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">{r.co}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{r.type}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'present' ? 'bg-aims-green/15 text-aims-green' : r.status === 'late' ? 'bg-aims-orange/15 text-aims-orange' : r.status === 'leave' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500')}>{r.status}</span></td>
                  </tr>
                ))}
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
              {MOCK_VIOLATIONS.map((v) => (
                <div key={v.id} className="bg-white rounded-lg border border-red-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-[18px]">gps_off</span>{v.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.ts} · Expected: {v.expected} · Attempted from: {v.attempted} ({v.distance})</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Action: {v.action}</p>
                      {v.recurring && <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500 uppercase">Flag: Recurring (3 violations this month)</span>}
                    </div>
                    <button onClick={() => notify('Action Taken', `Manual resolution recorded for ${v.name}.`)} className="text-[10px] font-bold text-aims-navy hover:underline">Take Action</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Attendance Anomalies (Pattern detection)</h3>
            <div className="space-y-2">
              {MOCK_ANOMALIES.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-aims-orange text-[18px]">monitoring</span>
                    <div><p className="text-sm font-bold text-slate-900">{a.name}</p><p className="text-xs text-slate-500">{a.detail}</p></div>
                  </div>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', a.severity === 'high' ? 'bg-red-50 text-red-500' : 'bg-aims-orange/15 text-aims-orange')}>{a.severity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => notify('Reminder Comms', 'Check-in procedure reminder sent to all staff.')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Send Reminder Comms</button>
          </div>
        </div>
      )}

      {/* ── PUNCTUALITY ANALYTICS ── */}
      {activeTab === 'punctuality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Individual Leaderboard (This Month)</h3>
            <div className="space-y-3">
              {MOCK_PUNCTUALITY.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{p.rank}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5"><span className="font-bold text-slate-800">{p.name}</span><span className={cn('font-extrabold', p.flag ? 'text-aims-orange' : 'text-aims-green')}>{p.pct}% on time{p.flag ? ' ⚠️' : ''}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className={cn('h-1.5 rounded-full', p.flag ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${p.pct}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Department Trends</h3>
            <div className="space-y-4">
              {MOCK_DEPT_TRENDS.map((d) => (
                <div key={d.dept}>
                  <div className="flex justify-between text-xs mb-0.5"><span className="font-bold text-slate-800">{d.dept}</span><span className={cn('font-extrabold', d.trend === 'down' ? 'text-red-500' : 'text-aims-green')}>{d.pct}% average punctuality{d.trend === 'down' ? ' ⚠️ (trending down)' : ''}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', d.trend === 'down' ? 'bg-red-400' : 'bg-aims-green')} style={{ width: `${d.pct}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4">Finance late arrivals up 60% week-on-week — reminder comms recommended.</p>
          </div>
        </div>
      )}
    </div>
  );
}
