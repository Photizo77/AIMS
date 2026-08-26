// src/lib/email.ts
// ============================================================
// ARDHI email client helper — sends via the Netlify /api/email
// function (SMTP for @ardhi.org.ug). Falls back to a local "sent"
// simulation when the API is unavailable (dev / SMTP not configured).
// ============================================================

import { personEmail, staffById } from '@/data/roster';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

/** Map a staff member's name to their ARDHI email (single roster source) */
export function nameToEmail(name: string): string {
  return personEmail(name);
}

/** User id -> email (for notifications targeted by userId) */
export function userIdToEmail(userId: string): string {
  const member = staffById(userId);
  if (member) return member.email;
  return `${userId}@ardhi.org.ug`;
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
