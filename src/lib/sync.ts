// src/lib/sync.ts
// ============================================================
// AIMS — server sync engine (Phase 1).
// Bridges the unified browser storage layer to the AIMS backend
// /collections/:key API. Sync is OPT-IN per domain (default OFF) and only
// runs for API-authenticated sessions.
//
//   Push : saveJSON() in storage.ts dispatches SYNC_SAVE_EVENT → this module
//          debounces a PUT /collections/:key (whole-array replace).
//   Pull : pullEnabledDomains() on API login, and explicit restore/backup
//          from Settings → Data Vault.
//   Guard: PUTs carry baseUpdatedAt; a 409 conflict surfaces as
//          SYNC_CONFLICT_EVENT → UI offers pull / overwrite / stop syncing.
// ============================================================

import {
  STORAGE_KEYS,
  DATA_CHANGED_EVENT,
  loadJSON,
} from '@/lib/storage';
import { apiEnabled, apiRequest, getToken } from '@/lib/api';

// ── Events ──
export const SYNC_CONFLICT_EVENT = 'aims:sync-conflict';
export interface SyncConflictDetail { key: string; serverUpdatedAt?: string | null; }

const TOGGLES_KEY = 'aims_sync_toggles';
const META_KEY = 'aims_sync_meta';

// ── Labels for the Settings panel ──
export const SYNCABLE_LABELS: Record<string, string> = {
  grants: 'Grants',
  projects: 'Innovations',
  finance: 'Finance',
  requisitions: 'Requisitions',
  proposals: 'Proposals',
  compliance: 'Compliance vault',
  notifications: 'Notifications',
  feed: 'Feed',
  employees: 'People directory',
  hrDocs: 'HR documents',
  docsLibrary: 'Document library',
  inventory: 'Inventory',
  attendanceRegister: 'Attendance register',
  leave: 'Leave',
  offboarding: 'Offboarding',
  userOps: 'User operations',
  crm: 'CRM contacts',
  contracts: 'Contracts',
  flags: 'Flags',
  formSubmissions: 'Form submissions',
};

/** Storage-key names that are data domains (excludes UI state + per-user attendance prefix). */
const EXCLUDED = new Set(['fab', 'sidebar', 'attendancePrefix']);
export const SYNCABLE_NAMES: string[] = Object.keys(STORAGE_KEYS).filter((n) => !EXCLUDED.has(n));

/** Map a syncable name to its full storage key value, e.g. 'grants' → 'aims_grants'. */
export function storageKeyFor(name: string): string {
  return STORAGE_KEYS[name as keyof typeof STORAGE_KEYS] ?? name;
}

// ── Toggles (per-domain, default OFF) ──
interface Toggles { [name: string]: boolean | undefined; }

function readToggles(): Toggles {
  try {
    const raw = localStorage.getItem(TOGGLES_KEY);
    return raw ? (JSON.parse(raw) as Toggles) : {};
  } catch { return {}; }
}

function writeToggles(t: Toggles): void {
  try { localStorage.setItem(TOGGLES_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

export function isSyncEnabled(name: string): boolean {
  return readToggles()[name] === true;
}

export function setSyncEnabled(name: string, on: boolean): void {
  const t = readToggles();
  if (on) t[name] = true; else delete t[name];
  writeToggles(t);
}

// ── Sync metadata (server timestamps per domain) ──
export interface SyncMetaEntry {
  serverUpdatedAt?: string;
  lastPushedAt?: string;
  lastPulledAt?: string;
}
type SyncMeta = Record<string, SyncMetaEntry | undefined>;

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as SyncMeta) : {};
  } catch { return {}; }
}

function writeMeta(m: SyncMeta): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

function metaFor(name: string): SyncMetaEntry {
  return readMeta()[name] ?? {};
}

function setMeta(name: string, entry: SyncMetaEntry): void {
  const m = readMeta();
  m[name] = { ...metaFor(name), ...entry };
  writeMeta(m);
}

// ── Local helpers ──
export function localRecords(name: string): unknown[] | null {
  const raw = loadJSON<unknown[] | null>(storageKeyFor(name), null);
  return Array.isArray(raw) ? raw : null;
}

function writeLocal(name: string, records: unknown[]): void {
  try { localStorage.setItem(storageKeyFor(name), JSON.stringify(records)); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key: storageKeyFor(name) } })); } catch { /* ignore */ }
}

const inFlight = new Set<string>();
const debounce: Record<string, ReturnType<typeof setTimeout>> = {};

// ── Push ──
export interface PushOutcome {
  name: string;
  ok: boolean;
  conflict?: boolean;
  error?: string;
  serverUpdatedAt?: string | null;
}

/** PUT the whole collection (atomic replace) with optimistic concurrency. */
export async function pushRecords(
  name: string,
  records: unknown[],
  opts: { force?: boolean } = {}
): Promise<PushOutcome> {
  const base: PushOutcome = { name, ok: false };
  if (!apiEnabled || !getToken()) return { ...base, error: 'Not connected to the AIMS server' };
  if (inFlight.has(name)) return { ...base, error: 'Already syncing' };

  inFlight.add(name);
  try {
    const entry = metaFor(name);
    const res = await apiRequest<{ name: string; records: unknown[]; updatedAt: string }>(
      `/collections/${encodeURIComponent(storageKeyFor(name))}`,
      {
        method: 'PUT',
        auth: true,
        body: {
          records,
          baseUpdatedAt: entry.serverUpdatedAt ?? undefined,
          force: opts.force === true ? true : undefined,
        },
      }
    );

    if (res.ok) {
      const now = new Date().toISOString();
      setMeta(name, { serverUpdatedAt: res.data.updatedAt, lastPushedAt: now });
      return { ...base, ok: true, serverUpdatedAt: res.data.updatedAt };
    }

    if (res.status === 409) {
      const detail = res.detail as { serverUpdatedAt?: string } | null | undefined;
      const serverUpdatedAt = detail?.serverUpdatedAt ?? null;
      // Surface the conflict to the UI (banner) but don't clear the guard.
      try {
        window.dispatchEvent(
          new CustomEvent<SyncConflictDetail>(SYNC_CONFLICT_EVENT, {
            detail: { key: name, serverUpdatedAt },
          })
        );
      } catch { /* ignore */ }
      return { ...base, conflict: true, error: res.error, serverUpdatedAt };
    }

    return { ...base, error: res.error };
  } finally {
    inFlight.delete(name);
  }
}

/** Debounced push triggered by saveJSON events. */
export function queuePush(name: string, records: unknown[]): void {
  if (debounce[name]) clearTimeout(debounce[name]);
  debounce[name] = setTimeout(() => {
    pushRecords(name, records).catch(() => { /* handled inside */ });
  }, 1200);
}

// ── Pull ──
export interface PullOutcome { name: string; pulled: boolean; error?: string; }

/** Pull one domain from the server (404 = no copy yet → not pulled). */
export async function pullDomain(name: string): Promise<PullOutcome> {
  if (!apiEnabled || !getToken()) return { name, pulled: false, error: 'Not connected' };
  const res = await apiRequest<{ name: string; records: unknown[]; updatedAt: string }>(
    `/collections/${encodeURIComponent(storageKeyFor(name))}`,
    { auth: true }
  );
  if (res.ok) {
    writeLocal(name, res.data.records);
    setMeta(name, { serverUpdatedAt: res.data.updatedAt, lastPulledAt: new Date().toISOString() });
    return { name, pulled: true };
  }
  // 404 = no server copy yet — nothing to pull (not an error)
  return { name, pulled: false, error: res.status === 404 ? undefined : res.error };
}

/**
 * Pull every enabled domain. A domain is pulled when:
 *  - the browser has no local copy, OR
 *  - the server copy is newer than the last successful push from this browser
 *    (someone else edited it), OR
 *  - restoreAll() / explicit pull is requested.
 */
export async function pullEnabledDomains(): Promise<string[]> {
  if (!apiEnabled || !getToken()) return [];
  const changed: string[] = [];
  for (const name of SYNCABLE_NAMES) {
    if (!isSyncEnabled(name)) continue;
    const local = localRecords(name);
    const entry = metaFor(name);
    const shouldPull =
      local === null || local.length === 0
        ? true
        : Boolean(entry.serverUpdatedAt && entry.lastPushedAt && entry.serverUpdatedAt > entry.lastPushedAt);
    if (!shouldPull) continue;
    const out = await pullDomain(name);
    if (out.pulled) changed.push(name);
  }
  return changed;
}

/** Restore every syncable domain from the server (Data Vault → Restore). */
export async function restoreAllFromServer(): Promise<{ restored: string[]; errors: string[] }> {
  const restored: string[] = [];
  const errors: string[] = [];
  for (const name of SYNCABLE_NAMES) {
    const out = await pullDomain(name);
    if (out.pulled) restored.push(name);
    else if (out.error) errors.push(`${name}: ${out.error}`);
  }
  return { restored, errors };
}

/** Back up every syncable domain with local data to the server (Data Vault → Backup). */
export async function backupAllToServer(): Promise<{ pushed: string[]; conflicts: string[]; errors: string[] }> {
  const pushed: string[] = [];
  const conflicts: string[] = [];
  const errors: string[] = [];
  for (const name of SYNCABLE_NAMES) {
    const records = localRecords(name);
    if (!records || records.length === 0) continue;
    const out = await pushRecords(name, records);
    if (out.ok) pushed.push(name);
    else if (out.conflict) conflicts.push(name);
    else errors.push(`${name}: ${out.error ?? 'failed'}`);
  }
  return { pushed, conflicts, errors };
}
