// src/lib/storage.ts
// ============================================================
// AIMS — unified browser storage layer.
// Every domain persists through here, which makes the whole dataset
// exportable/importable (Data Vault) and gives us one place to swap in
// a real backend later (replace loadJSON/saveJSON with API calls).
// ============================================================

export const STORAGE_KEYS = {
  grants: 'aims_grants',
  projects: 'aims_projects',
  finance: 'aims_finance',
  requisitions: 'aims_requisitions',
  proposals: 'aims_proposals',
  compliance: 'aims_compliance_vault',
  notifications: 'aims_notifications',
  feed: 'aims_feed_messages',
  attendancePrefix: 'aims_attendance_',
  fab: 'aims_fab_pos',
  sidebar: 'sidebar-collapsed',
  employees: 'aims_employees_onboarding',
  hrDocs: 'aims_hr_employee_docs',
  docsLibrary: 'aims_docs_library',
  inventory: 'aims_inventory',
  attendanceRegister: 'aims_attendance_register',
  leave: 'aims_leave',
  offboarding: 'aims_offboarding',
  userOps: 'aims_user_ops',
  crm: 'aims_crm',
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
  notifyDataChanged(key);
}

// ── Live update bus ──
// Every save dispatches a window event so any component using useLiveData()
// re-reads the store and refreshes automatically (same tab, or other tabs
// via the native 'storage' event).
export const DATA_CHANGED_EVENT = 'aims:data-changed';

export function notifyDataChanged(key?: string): void {
  try {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key } }));
  } catch { /* ignore */ }
}

// ── Data Vault: export & import the whole dataset ──
export function exportAllData(): Record<string, unknown> {
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: 'aims', version: 1 };
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch { /* ignore */ }
  });
  return data;
}

export function importAllData(data: Record<string, unknown>): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (data[key] !== undefined) {
      try { localStorage.setItem(key, JSON.stringify(data[key])); } catch { /* ignore */ }
    }
  });
}

export function downloadFile(filename: string, content: string, type = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Render rows as CSV text */
export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}
