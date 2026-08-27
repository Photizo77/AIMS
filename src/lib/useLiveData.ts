// src/lib/useLiveData.ts
// ============================================================
// AIMS — live auto-update hook.
// Returns a version counter that bumps whenever any domain writes
// through the unified storage layer (or a write happens in another
// tab). Components that read service data can call useLiveData() to
// re-render and re-read the freshest values automatically, so every
// card, counter and list stays in sync without manual refresh.
// ============================================================

import { useEffect, useState } from 'react';
import { DATA_CHANGED_EVENT } from '@/lib/storage';

/**
 * Subscribe to data changes.
 * @param key Optional storage key filter — omit to react to any change.
 * @returns a version number that increments on every matching change.
 */
export function useLiveData(key?: string): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onData = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      if (!key || !detail?.key || detail.key === key) setVersion((v) => v + 1);
    };
    // Cross-tab sync: any other tab writing to localStorage fires 'storage'.
    const onStorage = () => setVersion((v) => v + 1);

    window.addEventListener(DATA_CHANGED_EVENT, onData);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onData);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  return version;
}
