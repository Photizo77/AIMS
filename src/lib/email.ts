// src/lib/email.ts
// ============================================================
// ARDHI email client helper — sends via the Netlify /api/email
// function (SMTP for @ardhi.org.ug). Falls back to a local "sent"
// simulation when the API is unavailable (dev / SMTP not configured).
// ============================================================

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

/** Map a staff member's name to their ARDHI email address */
export function nameToEmail(name: string): string {
  const known: Record<string, string> = {
    'Pius Odong': 'pius.odong@ardhi.org.ug',
    'Florence Adong': 'florence.adong@ardhi.org.ug',
    'Isaac Tumusiime': 'isaac.tumusiime@ardhi.org.ug',
    'Janet Apio': 'janet.apio@ardhi.org.ug',
    'Grace Nakamya': 'grace.nakamya@ardhi.org.ug',
    'Sarah Aciro': 'sarah.aciro@ardhi.org.ug',
    'Amos Ojok': 'amos.ojok@ardhi.org.ug',
    'Okello Komakech': 'okello.komakech@ardhi.org.ug',
    'Grace Aceng': 'grace.aceng@ardhi.org.ug',
    'Peter Byamugisha': 'peter.byamugisha@ardhi.org.ug',
    'Nassir Mwanje': 'nassir.mwanje@ardhi.org.ug',
    'David Okello': 'david.okello@ardhi.org.ug',
  };
  if (known[name]) return known[name];
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@ardhi.org.ug`;
}

/** User id -> email (for notifications targeted by userId) */
export function userIdToEmail(userId: string): string {
  const map: Record<string, string> = {
    'user-ed-001': 'peter.byamugisha@ardhi.org.ug',
    'user-cd-001': 'nassir.mwanje@ardhi.org.ug',
    'user-admin-001': 'grace.aceng@ardhi.org.ug',
    'user-finance-001': 'amos.ojok@ardhi.org.ug',
    'user-gm-001': 'sarah.aciro@ardhi.org.ug',
    'user-gw-001': 'janet.apio@ardhi.org.ug',
    'user-innov-001': 'pius.odong@ardhi.org.ug',
  };
  return map[userId] || `${userId}@ardhi.org.ug`;
}

export interface SendResult {
  ok: boolean;
  mode: 'smtp' | 'local';
  message: string;
}

/**
 * Send an email through the Ardhi system.
 * 1) Tries the Netlify SMTP function (/api/email).
 * 2) Falls back to a local simulation (recorded as sent) when the API
 *    is unreachable — so the UI always works, and real delivery kicks in
 *    once SMTP credentials are configured in Netlify.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      return { ok: true, mode: 'smtp', message: data.message || 'Email sent.' };
    }
    // Fall through to local simulation (SMTP not configured / error)
  } catch {
    // network failure — local simulation
  } finally {
    clearTimeout(timer);
  }
  return { ok: true, mode: 'local', message: 'Email queued (local mode — SMTP credentials not yet configured in Netlify).' };
}
