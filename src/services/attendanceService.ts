// src/services/attendanceService.ts
// ============================================================
// AIMS — Attendance register (persisted).
// Company-wide register for HR / Company Admin management:
// real-time presence, historical records, geofence violations,
// pattern anomalies and reminder comms. Built over the unified
// staff roster; every mutation saves through the storage layer so
// screens auto-update via useLiveData and data survives reloads.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { ACTIVE_STAFF } from '@/data/roster';

export type PresenceMode = 'physical' | 'remote' | 'absent' | 'leave';
export type HistoryStatus = 'present' | 'late' | 'absent' | 'leave';

export interface PresenceRow {
  id: string; name: string; dept: string; checkIn: string;
  mode: PresenceMode; location: string; note?: string;
}
export interface HistoryRow {
  id: string; staffId: string; name: string; dept: string; date: string;
  checkIn: string; checkOut: string; mode: 'physical' | 'remote'; status: HistoryStatus;
}
export interface Violation {
  id: string; staffId: string; name: string; ts: string; distance: string;
  attempted: string; note: string; action?: string; resolved: boolean; recurring?: boolean;
}
export interface Anomaly { id: string; name: string; detail: string; severity: 'high' | 'medium'; resolved: boolean; }
export interface Reminder { id: string; sentAt: string; subject: string; body: string; recipients: number; }

interface AttState {
  presence: PresenceRow[];
  history: HistoryRow[];
  violations: Violation[];
  anomalies: Anomaly[];
  reminders: Reminder[];
}

function dayStr(offset = 0): string { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); }
function displayDate(offset = 0): string { const d = new Date(); d.setDate(d.getDate() - offset); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

const MODES: PresenceMode[] = ['physical', 'physical', 'remote', 'physical', 'physical', 'remote', 'absent', 'leave'];
const TIMES = ['07:58 AM', '08:05 AM', '08:12 AM', '08:27 AM', '08:31 AM', '08:45 AM', '—', '—'];

function seedState(): AttState {
  const people = ACTIVE_STAFF;
  const presence: PresenceRow[] = people.map((p, i) => {
    const mode = MODES[i % MODES.length];
    return {
      id: p.id, name: p.name, dept: p.department, checkIn: TIMES[i % TIMES.length],
      mode, location: mode === 'remote' ? 'Remote — Home' : mode === 'physical' ? 'Office (geofenced)' : '—',
      note: mode === 'absent' ? 'Not checked in today' : mode === 'leave' ? 'On approved leave' : undefined,
    };
  });

  const history: HistoryRow[] = [];
  const statusOf = (name: string, mode: PresenceMode): HistoryStatus => {
    if (mode === 'leave') return 'leave';
    if (mode === 'absent') return 'absent';
    // deterministic "late" for a couple of people
    if (name.includes('Janet') || name.includes('Isaac')) return 'late';
    return 'present';
  };
  const ciBy = (name: string): string => (name.includes('Janet') || name.includes('Isaac') ? '08:42 AM' : '08:10 AM');
  people.forEach((p, idx) => {
    const mode = MODES[idx % MODES.length];
    if (mode === 'physical' || mode === 'remote') {
      history.push({ id: `h-${p.id}-0`, staffId: p.id, name: p.name, dept: p.department, date: dayStr(0), checkIn: ciBy(p.name), checkOut: '05:30 PM', mode, status: statusOf(p.name, mode) });
    }
    history.push({ id: `h-${p.id}-1`, staffId: p.id, name: p.name, dept: p.department, date: dayStr(1), checkIn: ciBy(p.name), checkOut: '05:15 PM', mode: 'physical', status: statusOf(p.name, mode) });
  });

  const violations: Violation[] = [
    { id: 'v1', staffId: 'u-isaac', name: 'Isaac Tumusiime', ts: `${displayDate(0)}, 09:30 AM`, distance: '2km away', attempted: 'GPS 1.2456°S, 36.7891°E', note: 'Attempted physical check-in outside geofence', resolved: false, recurring: true },
    { id: 'v2', staffId: 'u-florence', name: 'Florence Adong', ts: `${displayDate(1)}, 08:55 AM`, distance: '5km away', attempted: 'GPS 1.3012°S, 36.8123°E', note: 'Attempted physical check-in outside geofence', resolved: false },
  ];

  const anomalies: Anomaly[] = [
    { id: 'an1', name: 'Isaac Tumusiime', detail: 'Recurring lateness — 8 times this month', severity: 'high', resolved: false },
    { id: 'an2', name: 'Florence Adong', detail: 'Remote check-ins 40% of month (role is office-based)', severity: 'medium', resolved: false },
    { id: 'an3', name: 'Finance department', detail: 'Late arrivals up 60% week-on-week', severity: 'high', resolved: false },
  ];

  return { presence, history, violations, anomalies, reminders: [] };
}

const persisted = loadJSON<AttState | null>(STORAGE_KEYS.attendanceRegister, null);
let state: AttState = persisted && persisted.presence ? persisted : seedState();

function persist(): void { saveJSON(STORAGE_KEYS.attendanceRegister, state); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const attendanceGet = {
  presence: (): PresenceRow[] => clone(state.presence),
  history: (): HistoryRow[] => clone(state.history),
  violations: (): Violation[] => clone(state.violations),
  anomalies: (): Anomaly[] => clone(state.anomalies),
  reminders: (): Reminder[] => clone(state.reminders),
  counts: () => {
    const presence = state.presence;
    return {
      total: presence.length,
      physical: presence.filter((p) => p.mode === 'physical').length,
      remote: presence.filter((p) => p.mode === 'remote').length,
      absent: presence.filter((p) => p.mode === 'absent').length,
      leave: presence.filter((p) => p.mode === 'leave').length,
      lateToday: state.history.filter((h) => h.date === dayStr(0) && h.status === 'late').length,
    };
  },
};

/** Mark an employee absent for today (management action) */
export function markAbsence(staffId: string, note: string): void {
  const person = ACTIVE_STAFF.find((s) => s.id === staffId);
  state = {
    ...state,
    presence: state.presence.map((p) => (p.id === staffId ? { ...p, mode: 'absent' as PresenceMode, location: '—', checkIn: '—', note: note || 'Marked absent by HR' } : p)),
    history: [
      {
        id: `h-${Date.now()}`, staffId, name: person?.name ?? 'Employee', dept: person?.department ?? '—',
        date: dayStr(0), checkIn: '—', checkOut: '—', mode: 'physical', status: 'absent' as HistoryStatus,
      },
      ...state.history.filter((h) => !(h.staffId === staffId && h.date === dayStr(0))),
    ],
  };
  persist();
}

export function resolveViolation(id: string, actionNote: string): void {
  state = { ...state, violations: state.violations.map((v) => (v.id === id ? { ...v, resolved: true, action: actionNote } : v)) };
  persist();
}

export function resolveAnomaly(id: string): void {
  state = { ...state, anomalies: state.anomalies.map((a) => (a.id === id ? { ...a, resolved: true } : a)) };
  persist();
}

/** Record reminder comms (subject/body to all active staff) */
export function sendReminder(subject: string, body: string): Reminder {
  const reminder: Reminder = { id: `rem-${Date.now()}`, sentAt: new Date().toISOString(), subject, body, recipients: ACTIVE_STAFF.length };
  state = { ...state, reminders: [reminder, ...state.reminders] };
  persist();
  return reminder;
}

/** All active staff email addresses (for real email dispatch) */
export function staffEmails(): string[] { return ACTIVE_STAFF.map((s) => s.email).filter(Boolean); }
