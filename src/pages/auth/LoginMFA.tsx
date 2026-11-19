// src/pages/auth/LoginMFA.tsx
// ============================================================
// AIMS — Sign In (ARDHI institutional identity screen).
// Left: brand + impact showcase. Right: authentication card.
// Auth is real: backend JWT when VITE_API_URL is configured, persona/onboarded
// credentials offline — then a role-aware redirect (roleLanding).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { roleLanding } from '@/config/navigation';
import { cn } from '@/lib/utils';

const REMEMBER_KEY = 'aims_remember_email';

/** Institutional impact figures shown on the brand panel */
const IMPACT = [
  { value: '1.8M+', label: 'Hectares Protected' },
  { value: '420k', label: 'Families Documented' },
  { value: '99.4%', label: 'Dispute Clearance' },
];

type Phase = 'idle' | 'authenticating' | 'granted';

export function LoginMFA() {
  const navigate = useNavigate();
  const { login, authMode } = useAuth();
  const { showToast } = useNotifications();

  const rememberedEmail = (() => {
    try { return localStorage.getItem(REMEMBER_KEY) ?? ''; } catch { return ''; }
  })();

  const [email, setEmail] = useState(rememberedEmail || 'admin@aims.org');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const emailRef = useRef<HTMLInputElement>(null);

  const busy = phase !== 'idle';
  const serverLinked = authMode === 'api';

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setPhase('authenticating');

    try {
      // Remember / forget the workstation identity
      try {
        if (remember && email.trim()) localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch { /* storage unavailable */ }

      const outcome = await login(email, password);
      if (outcome.user) {
        setPhase('granted');
        const target = roleLanding(outcome.user.role);
        window.setTimeout(() => navigate(target, { replace: true }), 420);
      } else {
        setPhase('idle');
        setError(outcome.error || 'Invalid credentials. Please check your email and password.');
      }
    } catch {
      setPhase('idle');
      setError('Sign-in failed unexpectedly. Please try again.');
    }
  };

  const buttonLabel =
    phase === 'authenticating' ? 'Authenticating credentials…'
      : phase === 'granted' ? 'Access granted. Redirecting…'
        : 'Sign In to Dashboard';
  const buttonIcon = phase === 'authenticating' ? 'sync' : phase === 'granted' ? 'check_circle' : 'arrow_forward';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-login-bg font-jakarta text-login-on-surface antialiased relative selection:bg-login-primary selection:text-login-on-primary">
      {/* Faint institutional watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.03]">
        <svg className="w-[820px] h-[820px] text-login-primary" fill="currentColor" viewBox="0 0 200 200" aria-hidden="true">
          <path d="M100 0 L195 55 L195 145 L100 200 L5 145 L5 55 Z M100 25 L25 68 L25 132 L100 175 L175 132 L175 68 Z" fillRule="evenodd" />
          <circle cx="100" cy="100" r="32" />
        </svg>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 sm:px-6 py-8 lg:py-10">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl bg-login-surface-lowest">
            {/* ── Left: brand & impact showcase ── */}
            <div className="relative lg:col-span-6 bg-gradient-to-br from-login-primary via-login-primary-container to-login-primary flex flex-col justify-between p-8 sm:p-12 lg:p-14 text-login-on-primary overflow-hidden min-h-[520px] lg:min-h-[580px]">
              {/* Ambient topographic vectors */}
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <svg className="w-full h-full" fill="none" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M-50 150 C 150 100, 300 280, 500 210 C 700 140, 750 350, 900 320" stroke="currentColor" strokeDasharray="6 8" strokeWidth="1.5" />
                  <path d="M-30 300 C 180 260, 320 420, 530 360 C 740 300, 800 480, 920 450" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M-10 450 C 200 410, 340 570, 550 510 C 760 450, 820 620, 940 600" stroke="currentColor" strokeDasharray="4 6" strokeWidth="1.2" />
                  <path d="M10 600 C 220 560, 360 720, 570 660 C 780 600, 840 760, 960 740" stroke="currentColor" strokeWidth="1" />
                  <circle cx="650" cy="180" opacity="0.6" r="160" stroke="currentColor" strokeWidth="1" />
                  <circle cx="650" cy="180" opacity="0.4" r="90" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>

              {/* Logo + headline */}
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-center">
                  <div className="p-2 rounded-xl bg-login-surface-lowest shadow-lg inline-flex items-center">
                    <img
                      src="https://i.postimg.cc/N0G2CsXY/Screenshot-2026-08-01-134115.png"
                      alt="ARDHI Law and Policy Initiative"
                      className="h-10 object-contain"
                    />
                  </div>
                </div>

                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-login-on-primary-container text-[11px] leading-4 tracking-[0.06em] font-bold mb-4 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-login-primary-fixed animate-ping" />
                    <span>Advocacy • Systems Innovations • Impact</span>
                  </div>
                  <h1 className="text-[32px] sm:text-[36px] leading-[42px] sm:leading-[44px] tracking-[-0.02em] font-bold text-white">
                    ARDHI drives community resilience through advocacy and systems innovations.
                  </h1>
                  <p className="text-[15px] sm:text-[16px] leading-6 text-white/85 mt-4">
                    In the areas of agriculture and food security, waste management, disaster preparedness, and land governance across East Africa.
                  </p>
                </div>
              </div>

              {/* Programme highlight */}
              <div className="relative z-10 my-8 rounded-2xl overflow-hidden shadow-xl bg-white/10 backdrop-blur-md p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-md bg-login-primary">
                    <img src="/login-impact.svg" alt="Climate education and school recycling programme" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-[11px] leading-4 tracking-[0.06em] font-bold uppercase text-login-on-primary-container">Community &amp; Youth Dispatch</span>
                    <span className="text-[16px] leading-[22px] font-semibold text-white mt-0.5">Climate Education in Secondary Schools</span>
                    <div className="flex items-center gap-2 mt-1.5 text-white/80 text-[13px] leading-[18px] flex-wrap">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">recycling</span>Active in 14 Schools</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span>Waste Sorting Initiative</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic indicators */}
              <div className="relative z-10 pt-6">
                <div className="grid grid-cols-3 gap-4">
                  {IMPACT.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-[24px] sm:text-[28px] leading-9 font-bold text-white tracking-[-0.02em]">{s.value}</span>
                      <span className="text-[13px] leading-[18px] text-white/75 mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: authentication ── */}
            <div className="lg:col-span-6 bg-login-surface-lowest p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
              <div className="max-w-md w-full mx-auto my-auto">
                <div className="mb-8">
                  <h2 className="text-[26px] sm:text-[28px] leading-9 tracking-[-0.02em] font-bold text-login-on-surface">Sign In</h2>
                  <p className="text-[14px] leading-5 text-login-secondary mt-1">Access the Ardhi Internal Management System (AIMS)</p>
                </div>

                {error && (
                  <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#ffdad6] bg-[#ffdad6]/40 px-4 py-3">
                    <span className="material-symbols-outlined text-[18px] text-[#93000a] mt-0.5">error</span>
                    <p className="text-[13px] leading-[18px] text-[#93000a]">{error}</p>
                  </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="emailInput" className="text-[14px] leading-5 font-semibold text-login-on-surface flex items-center justify-between">
                      <span>Work Email</span>
                      <span className="text-[11px] leading-4 tracking-[0.06em] font-normal uppercase text-login-secondary">Required</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="emailInput"
                        ref={emailRef}
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        disabled={busy}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@aims.org"
                        className="w-full h-12 px-4 pr-11 rounded-xl bg-login-surface-low text-login-on-surface text-[14px] leading-5 shadow-inner focus:outline-none focus:ring-2 focus:ring-login-primary focus:bg-login-surface-lowest transition-all disabled:opacity-60"
                      />
                      <span className="material-symbols-outlined absolute right-3.5 text-login-secondary text-[20px] pointer-events-none">mail</span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="passwordInput" className="text-[14px] leading-5 font-semibold text-login-on-surface">Password</label>
                      <button
                        type="button"
                        onClick={() => showToast({ title: 'Password reset', message: 'Ask the Company Administrator to reset your credential in User Management → Actions → Reset credential.', type: 'info' })}
                        className="text-[12px] leading-4 font-semibold text-login-primary hover:underline transition-all"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="passwordInput"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        disabled={busy}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={serverLinked ? 'Ardhi@2026' : 'Enter your password'}
                        className="w-full h-12 px-4 pr-11 rounded-xl bg-login-surface-low text-login-on-surface text-[14px] leading-5 tracking-wider shadow-inner focus:outline-none focus:ring-2 focus:ring-login-primary focus:bg-login-surface-lowest transition-all disabled:opacity-60"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 text-login-secondary hover:text-login-on-surface transition-colors flex items-center justify-center p-1"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Remember */}
                  <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-login-outline-variant accent-login-primary cursor-pointer"
                    />
                    <span className="text-[13px] leading-[18px] text-login-secondary">Remember workstation for 14 days</span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={busy}
                    className={cn(
                      'w-full h-12 rounded-xl text-[14px] leading-5 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] group mt-1',
                      phase === 'granted'
                        ? 'bg-login-tertiary-container text-white'
                        : 'bg-login-primary hover:bg-login-primary-container text-login-on-primary',
                      busy && 'cursor-wait',
                    )}
                  >
                    <span>{buttonLabel}</span>
                    <span className={cn('material-symbols-outlined text-[20px]', phase === 'idle' && 'group-hover:translate-x-1 transition-transform', phase === 'authenticating' && 'animate-spin')}>
                      {buttonIcon}
                    </span>
                  </button>
                </form>

                {/* Sign-in reference — the system starts with the administrator account */}
                <div className="mt-6 rounded-xl border border-login-outline-variant/60 bg-login-surface-low px-4 py-3">
                  <p className="text-[11px] leading-4 tracking-[0.06em] font-bold uppercase text-login-secondary mb-2">
                    Administrator access{serverLinked ? ' · password Ardhi@2026' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@aims.org');
                      setPassword(serverLinked ? 'Ardhi@2026' : '');
                      setError('');
                      setRemember(true);
                      emailRef.current?.focus();
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded-lg bg-login-surface-lowest border border-login-outline-variant/60 px-3 py-2 text-left hover:border-login-primary/40 hover:bg-white transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-[18px] font-semibold text-login-on-surface">Maya Namutebi</span>
                      <span className="block text-[11px] leading-4 text-login-secondary truncate">admin@aims.org · Company Administrator</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-login-primary shrink-0">person_add</span>
                  </button>
                  <p className="text-[11px] leading-4 text-login-secondary mt-2">
                    Employees sign in with the credentials issued to them in the onboarding pipeline.
                  </p>
                </div>
              </div>

              {/* Security note */}
              <p className="text-[11px] leading-4 text-login-secondary/80 mt-8 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Confidential institutional system. Access is logged and audited.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full h-14 flex items-center justify-between px-4 sm:px-6 bg-login-surface-lowest/80 backdrop-blur-md shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
        <div className="w-full text-center text-[13px] leading-[18px] text-login-on-surface-variant">© 2026 Ardhi. All rights reserved.</div>
      </footer>
    </div>
  );
}
