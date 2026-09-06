// src/components/sync/SyncEngine.tsx
// ============================================================
// AIMS — sync engine host.
//  • Listens for saveJSON events and debounce-pushes enabled domains.
//  • After an API login it pulls enabled domains once (reloads when changed).
//  • Renders a conflict banner when the server copy changed underneath us
//    (409): Pull server copy / Overwrite with mine / Keep local & stop syncing.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SYNC_SAVE_EVENT } from '@/lib/storage';
import {
  SYNCABLE_LABELS,
  SYNCABLE_NAMES,
  SYNC_CONFLICT_EVENT,
  isSyncEnabled,
  localRecords,
  pullDomain,
  pullEnabledDomains,
  pushRecords,
  queuePush,
  setSyncEnabled,
  storageKeyFor,
  type SyncConflictDetail,
} from '@/lib/sync';

interface ConflictItem {
  name: string;
  serverUpdatedAt?: string | null;
}

export function SyncEngine() {
  const { user, authMode } = useAuth();
  const pulledRef = useRef(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [busyName, setBusyName] = useState<string | null>(null);

  const serverLinked = Boolean(user) && authMode === 'api';

  // Pull enabled domains once per API session; reload when server data arrived.
  useEffect(() => {
    if (!serverLinked || pulledRef.current) return;
    pulledRef.current = true;
    let cancelled = false;
    (async () => {
      const changed = await pullEnabledDomains();
      if (!cancelled && changed.length > 0) {
        // Services re-initialise from localStorage on load — one refresh applies the pull.
        window.location.reload();
      }
    })();
    return () => { cancelled = true; };
  }, [serverLinked]);

  // Push on save (debounced) for enabled domains.
  useEffect(() => {
    if (!serverLinked) return;
    const onSave = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: unknown }>).detail;
      if (!detail) return;
      const name = SYNCABLE_NAMES.find((n) => storageKeyFor(n) === detail.key);
      if (!name || !isSyncEnabled(name)) return;
      if (Array.isArray(detail.value)) queuePush(name, detail.value);
    };
    window.addEventListener(SYNC_SAVE_EVENT, onSave);
    return () => window.removeEventListener(SYNC_SAVE_EVENT, onSave);
  }, [serverLinked]);

  // Conflict events from pushRecords (409).
  useEffect(() => {
    const onConflict = (e: Event) => {
      const detail = (e as CustomEvent<SyncConflictDetail>).detail;
      if (!detail?.key) return;
      setConflicts((prev) =>
        prev.some((c) => c.name === detail.key) ? prev : [...prev, { name: detail.key, serverUpdatedAt: detail.serverUpdatedAt }]
      );
    };
    window.addEventListener(SYNC_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SYNC_CONFLICT_EVENT, onConflict);
  }, []);

  const handlePull = async (name: string) => {
    setBusyName(name);
    try {
      const out = await pullDomain(name);
      setConflicts((prev) => prev.filter((c) => c.name !== name));
      if (out.pulled) window.location.reload(); // apply server copy
    } finally {
      setBusyName(null);
    }
  };

  const handleOverwrite = async (name: string) => {
    setBusyName(name);
    try {
      const out = await pushRecords(name, localRecords(name) ?? [], { force: true });
      if (out.ok) setConflicts((prev) => prev.filter((c) => c.name !== name));
    } finally {
      setBusyName(null);
    }
  };

  const handleStopSyncing = (name: string) => {
    setSyncEnabled(name, false);
    setConflicts((prev) => prev.filter((c) => c.name !== name));
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,560px)] space-y-2">
      {conflicts.map((c) => (
        <div key={c.name} className="bg-white border border-aims-orange/40 shadow-xl rounded-2xl p-4">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-aims-orange text-[18px]">sync_problem</span>
            Sync conflict — {SYNCABLE_LABELS[c.name] ?? c.name}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            This data changed on the server since you last saved. Choose how to proceed — picking
            &ldquo;Pull&rdquo; discards your unsynced local edits for this domain.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => handlePull(c.name)}
              disabled={busyName === c.name}
              className="text-xs font-bold bg-aims-navy text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
            >
              Pull server copy
            </button>
            <button
              onClick={() => handleOverwrite(c.name)}
              disabled={busyName === c.name}
              className="text-xs font-bold bg-aims-orange text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
            >
              Overwrite with mine
            </button>
            <button
              onClick={() => handleStopSyncing(c.name)}
              className="text-xs font-bold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
            >
              Keep local &amp; stop syncing
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
