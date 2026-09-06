// src/components/sync/ServerSyncPanel.tsx
// ============================================================
// AIMS — Server sync settings (Settings → Data & Sync).
// Per-domain toggles (default OFF), connection status, and explicit
// whole-dataset Backup to server / Restore from server buttons.
// ============================================================
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiEnabled, API_URL } from '@/lib/api';
import {
  SYNCABLE_NAMES,
  SYNCABLE_LABELS,
  backupAllToServer,
  isSyncEnabled,
  restoreAllFromServer,
  setSyncEnabled,
} from '@/lib/sync';

export function ServerSyncPanel() {
  const { authMode } = useAuth();
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [result, setResult] = useState<{ kind: 'ok' | 'info'; text: string } | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SYNCABLE_NAMES.map((n) => [n, isSyncEnabled(n)]))
  );

  const connected = apiEnabled && authMode === 'api';

  const toggle = (name: string, on: boolean) => {
    setSyncEnabled(name, on);
    setEnabled((prev) => ({ ...prev, [name]: on }));
  };

  const handleBackup = async () => {
    setBusy('backup');
    setResult(null);
    try {
      const r = await backupAllToServer();
      const parts: string[] = [];
      if (r.pushed.length) parts.push(`${r.pushed.length} domain(s) backed up`);
      if (r.conflicts.length) parts.push(`${r.conflicts.length} conflicted (fix in the banner)`);
      if (r.errors.length) parts.push(`${r.errors.length} failed`);
      setResult({
        kind: r.conflicts.length || r.errors.length ? 'info' : 'ok',
        text: parts.length ? parts.join(' · ') : 'Nothing to back up — no local data yet',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Replace local data with the server copies for every domain? Local-only changes will be overwritten.')) return;
    setBusy('restore');
    setResult(null);
    try {
      const r = await restoreAllFromServer();
      const parts: string[] = [];
      if (r.restored.length) parts.push(`${r.restored.length} domain(s) restored from server`);
      if (r.errors.length) parts.push(`${r.errors.length} had no server copy or failed`);
      setResult({ kind: r.restored.length ? 'ok' : 'info', text: parts.join(' · ') || 'No server copies found' });
      if (r.restored.length > 0) {
        setTimeout(() => window.location.reload(), 800); // apply restored data
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-aims-green">cloud_sync</span>
            Server Sync
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sync selected modules to the AIMS server. Toggle a domain ON to push your changes and pull
            the latest copy after sign-in. Conflicts are never overwritten silently.
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold rounded-full px-2.5 py-1 ${
            connected ? 'bg-aims-green/10 text-aims-green' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {connected ? 'Connected' : apiEnabled ? 'Sign in to sync' : 'Demo mode'}
        </span>
      </div>

      {apiEnabled && !connected && (
        <p className="text-[11px] text-slate-400 mt-2">
          Server: {API_URL} — sync activates once you sign in with an AIMS account.
        </p>
      )}

      {!apiEnabled && (
        <p className="text-[11px] text-slate-400 mt-2">
          The AIMS server is not configured for this build (set VITE_API_URL). Data stays on this device.
        </p>
      )}

      {connected && (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 max-h-64 overflow-y-auto pr-1">
            {SYNCABLE_NAMES.map((name) => (
              <label
                key={name}
                className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 text-[13px] text-slate-700 cursor-pointer"
              >
                <span className="font-medium">{SYNCABLE_LABELS[name] ?? name}</span>
                <input
                  type="checkbox"
                  checked={enabled[name] === true}
                  onChange={(e) => toggle(name, e.target.checked)}
                  className="accent-aims-green w-4 h-4"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={handleBackup}
              disabled={busy !== null}
              className="text-xs font-bold bg-aims-green text-white rounded-lg px-3 py-2 hover:opacity-90 disabled:opacity-50"
            >
              {busy === 'backup' ? 'Backing up…' : 'Back up to server'}
            </button>
            <button
              onClick={handleRestore}
              disabled={busy !== null}
              className="text-xs font-bold bg-aims-navy text-white rounded-lg px-3 py-2 hover:opacity-90 disabled:opacity-50"
            >
              {busy === 'restore' ? 'Restoring…' : 'Restore from server'}
            </button>
          </div>

          {result && (
            <p className={`text-[11px] mt-2 ${result.kind === 'ok' ? 'text-aims-green' : 'text-amber-600'}`}>
              {result.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
