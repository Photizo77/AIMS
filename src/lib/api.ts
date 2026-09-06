// src/lib/api.ts
// ============================================================
// AIMS — backend API client (single seam to the AIMS backend).
// Enabled only when VITE_API_URL is configured; otherwise every
// helper reports "not configured" and the app runs in demo mode.
// ============================================================

import type { Role } from '@/types';

const RAW_URL: string | undefined = import.meta.env.VITE_API_URL;
export const API_URL = (RAW_URL ?? '').replace(/\/+$/, '');
export const apiEnabled = API_URL.length > 0;

/** User shape returned by the backend — mirrors the frontend User type. */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: string;
  createdAt: string;
  avatarUrl?: string;
}

// ── Token + cached session ──
const TOKEN_KEY = 'aims_auth_token';
const CACHE_KEY = 'aims_auth_user';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null): void {
  try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export function getCachedUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch { return null; }
}

export function setCachedUser(user: ApiUser | null): void {
  try { if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user)); else localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

// ── Request helper ──
export interface ApiOk<T> { ok: true; status: number; data: T; }
export interface ApiErr { ok: false; status: number; error: string; detail?: Record<string, unknown> | null; }
export type ApiResult<T> = ApiOk<T> | ApiErr;

const REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ApiResult<T>> {
  if (!apiEnabled) {
    return { ok: false, status: 0, error: 'Backend not configured (set VITE_API_URL)' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API_URL + path, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        payload?.message || payload?.error || `Request failed (${res.status})`;
      return { ok: false, status: res.status, error: message, detail: payload };
    }

    return { ok: true, status: res.status, data: (payload?.data as T) ?? (payload as T) };
  } catch {
    return { ok: false, status: 0, error: 'Cannot reach the AIMS server' };
  } finally {
    clearTimeout(timer);
  }
}

// ── Auth endpoints ──
export interface LoginResponse {
  user: ApiUser;
  token: string;
}

export function apiLogin(email: string, password: string): Promise<ApiResult<LoginResponse>> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function apiLogout(): Promise<ApiResult<unknown>> {
  return apiRequest('/auth/logout', { method: 'POST', auth: true });
}

/** Fetch the current user for the stored token (data.user unwrapped). */
export async function apiMe(): Promise<ApiResult<ApiUser>> {
  const res = await apiRequest<{ user: ApiUser }>('/auth/me', { auth: true });
  if (res.ok) return { ok: true, status: res.status, data: res.data.user };
  return res;
}
