// src/pages/auth/LoginMFA.tsx
// ============================================================
// AIMS — Login Page (Minimal, border-defined, no colored background)
// Authenticates against the AIMS backend when configured; falls back to
// persona accounts when the API is unreachable.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { roleLanding } from '@/config/navigation';

export function LoginMFA() {
  const navigate = useNavigate();
  const { login, authMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const outcome = await login(email, password);
      if (outcome.user) {
        // Attendance auto check-in is recorded by the attendance context on login.
        // Route to the role-specific landing (role-aware redirect).
        navigate(roleLanding(outcome.user.role), { replace: true });
      } else {
        setError(outcome.error || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setBusy(false);
    }
  };

  const serverLinked = authMode === 'api';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://i.postimg.cc/N0G2CsXY/Screenshot-2026-08-01-134115.png"
            alt="Ardhi"
            className="h-24 w-auto mx-auto object-contain"
          />
        </div>

        {/* Sign-in card — defined by a subtle border */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Access the Ardhi Internal Management System</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aims.org"
                required
                disabled={busy}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-green focus:border-aims-green disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={busy}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-green focus:border-aims-green disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-aims-green text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts — separated by a light divider */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
              Demo Accounts {serverLinked ? '(password: Ardhi@2026)' : '(Any Password)'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
              <span>cd@aims.org</span>
              <span>ed@aims.org</span>
              <span>sysadmin@aims.org</span>
              <span>admin@aims.org</span>
              <span>finance@aims.org</span>
              <span>grants@aims.org</span>
              <span>grantsmanager@aims.org</span>
              <span>innovation@aims.org</span>
            </div>
            {serverLinked && (
              <p className="text-[10px] text-slate-400 mt-3">
                Signed in via the AIMS server. Offline fallback: demo accounts accept any password.
              </p>
            )}
          </div>
        </div>

        {/* Minimal footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Ardhi. All rights reserved.
        </p>
      </div>
    </div>
  );
}
