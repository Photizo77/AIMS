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
  contracts: 'aims_contracts',
  flags: 'aims_flags',
  formSubmissions: 'aims_form_submissions',
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
  // Announce the save so the sync engine can push the collection to the
  // AIMS backend when that domain's server sync is enabled.
  try {
    window.dispatchEvent(new CustomEvent(SYNC_SAVE_EVENT, { detail: { key, value } }));
  } catch { /* ignore */ }
}

// ── Live update bus ──
// Every save dispatches a window event so any component using useLiveData()
// re-reads the store and refreshes automatically (same tab, or other tabs
// via the native 'storage' event).
export const DATA_CHANGED_EVENT = 'aims:data-changed';

/** Dispatched after every saveJSON — carries { key, value } for backend sync. */
export const SYNC_SAVE_EVENT = 'aims:sync-save';

export function notifyDataChanged(key?: string): void {
  try {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key } }));
  } catch { /* ignore */ }
}

// ── Demo dataset mode ──
// Clean by default: AIMS ships with NO dummy records. Demo content is
// loaded only when the demo marker is set (Settings → "Load demo dataset").
export const DEMO_KEY = 'aims_demo_loaded';

export function demoMode(): boolean {
  try { return localStorage.getItem(DEMO_KEY) === '1'; } catch { return false; }
}

export function setDemoMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(DEMO_KEY, '1');
    else localStorage.removeItem(DEMO_KEY);
  } catch { /* ignore */ }
}

// ── Data Vault: export & import the whole dataset ──
/** AIMS backup format version (kept in sync with releases) */
export const DATA_VAULT_VERSION = '1.0.0';
/** Baseline build hash shipped with this release (from the repo history) */
export const DATA_VAULT_BASELINE = '834446a0';

export interface VaultEnvelope {
  app: 'aims';
  type: 'full' | 'module';
  version: string;
  baseline: string;
  exportedAt: string;
  domain?: string;
  counts: Record<string, number>;
  data: Record<string, unknown>;
}

/** Timestamped file label, e.g. aims-backup-2026-09-02-1534-v1.0.0 */
export function vaultFilename(kind: 'backup' | 'module', domain?: string): string {
  const now = new Date();
  const stamp = `${now.toISOString().slice(0, 10)}-${now.toTimeString().slice(0, 5).replace(':', '')}`;
  return domain ? `aims-${kind}-${domain}-${stamp}-v${DATA_VAULT_VERSION}.json` : `aims-${kind}-${stamp}-v${DATA_VAULT_VERSION}.json`;
}

/** All localStorage entries that belong to AIMS (every aims_* key, incl. attendance-* variants) */
function aimsStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('aims_')) keys.push(key);
  }
  return keys;
}

function countOf(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  return 0;
}

/** Full dataset backup — metadata envelope + every aims_* storage key */
export function exportAllData(): VaultEnvelope {
  const data: Record<string, unknown> = {};
  const counts: Record<string, number> = {};
  aimsStorageKeys().forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        data[key] = parsed;
        counts[key] = countOf(parsed);
      }
    } catch { /* ignore */ }
  });
  // Read-only references captured so a full vault always reflects the org roster & knowledge base
  return {
    app: 'aims',
    type: 'full',
    version: DATA_VAULT_VERSION,
    baseline: DATA_VAULT_BASELINE,
    exportedAt: new Date().toISOString(),
    counts,
    data,
  };
}

/** Module-specific export (JSON) for one domain — single storage key plus metadata */
export function exportModuleData(storageKey: string): VaultEnvelope {
  const data: Record<string, unknown> = {};
  let parsed: unknown = null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) parsed = JSON.parse(raw) as unknown;
  } catch { /* ignore */ }
  if (parsed !== null) data[storageKey] = parsed;
  const counts: Record<string, number> = {};
  if (parsed !== null) counts[storageKey] = countOf(parsed);
  return {
    app: 'aims',
    type: 'module',
    version: DATA_VAULT_VERSION,
    baseline: DATA_VAULT_BASELINE,
    exportedAt: new Date().toISOString(),
    domain: storageKey,
    counts,
    data,
  };
}

/**
 * Validate an uploaded backup file before restore.
 * Accepts the current envelope format OR legacy flat maps written by older
 * builds; verifies the app marker and the AIMS version major.
 */
export function validateVaultFile(input: unknown): { ok: boolean; envelope?: VaultEnvelope | null; reason?: string } {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'The file is not a valid AIMS backup.' };
  const obj = input as Record<string, unknown>;
  const isEnvelope = obj.app === 'aims' && obj.data && typeof obj.data === 'object';
  const isLegacyFlat = Object.keys(obj).some((k) => k.startsWith('aims_'));
  if (!isEnvelope && !isLegacyFlat) return { ok: false, reason: 'The file is not a valid AIMS backup — no aims_* dataset found.' };
  if (isEnvelope) {
    const env = obj as unknown as VaultEnvelope;
    const major = typeof env.version === 'string' ? env.version.split('.')[0] : '';
    if (major && major !== DATA_VAULT_VERSION.split('.')[0]) {
      return { ok: false, reason: `Version mismatch — this backup was written by AIMS v${env.version}, but this build is v${DATA_VAULT_VERSION}.` };
    }
    return { ok: true, envelope: env };
  }
  return { ok: true, envelope: null };
}

/** Restore a validated vault into localStorage (data keys only — metadata is never written) */
export function importAllData(envelope: VaultEnvelope | Record<string, unknown> | null | undefined): void {
  if (!envelope) return;
  if ('data' in envelope && envelope.data && typeof envelope.data === 'object') {
    Object.entries(envelope.data as Record<string, unknown>).forEach(([key, value]) => {
      if (key.startsWith('aims_')) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
      }
    });
    return;
  }
  // Legacy flat map: every aims_* key stored as-is
  Object.entries(envelope as Record<string, unknown>).forEach(([key, value]) => {
    if (key.startsWith('aims_')) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
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

/** Key used to broadcast a flash request to every other open tab/window of AIMS */
export const FLASH_SIGNAL_KEY = 'aims_flash_signal';

/** Remove every AIMS storage key recorded in this browser (pure local wipe) */
export function wipeAimsStorage(): void {
  const doomed: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aims_')) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/**
 * FLASH / FACTORY RESET — wipe EVERYTHING recorded in this browser AND ask
 * every other open tab/window of AIMS to wipe itself too. Removes every
 * AIMS storage key (demo marker, attendance, notifications, feed, user ops…)
 * and broadcasts a unique signal so peer tabs re-init clean + reload.
 */
export function flashAllSystemData(): void {
  wipeAimsStorage();
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    localStorage.setItem(FLASH_SIGNAL_KEY, JSON.stringify({ ts: Date.now(), token }));
  } catch { /* ignore */ }
  notifyDataChanged();
}

let lastFlashToken = '';

/**
 * Arm cross-tab sync: when another tab flashes, wipe this tab's data too and
 * reload so every open AIMS window becomes clean together.
 */
export function armFlashSync(): void {
  const handler = (e: StorageEvent) => {
    if (e.key !== FLASH_SIGNAL_KEY || !e.newValue) return;
    try {
      const sig = JSON.parse(e.newValue) as { ts?: number; token?: string };
      if (!sig.token || sig.token === lastFlashToken) return;
      lastFlashToken = sig.token;
      wipeAimsStorage();
      notifyDataChanged();
      window.location.reload();
    } catch { /* ignore */ }
  };
  window.addEventListener('storage', handler);
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
