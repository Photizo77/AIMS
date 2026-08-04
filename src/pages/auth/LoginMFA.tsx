import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArdhiLogo } from '@/components/layout/ArdhiLogo'
import { cn } from '@/lib/utils'

type Step = 'credentials' | 'mfa'

export function LoginMFA() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [otpError, setOtpError] = useState(false)
  const [seconds, setSeconds] = useState(119)
  const [timerActive, setTimerActive] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  /* ── Timer countdown ── */
  useEffect(() => {
    if (!timerActive) return
    if (seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [timerActive, seconds])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  /* ── Step 1 submit ── */
  function handleCredentials(e: FormEvent) {
    e.preventDefault()
    setStep('mfa')
    setTimerActive(true)
    setTimeout(() => otpRefs.current[0]?.focus(), 150)
  }

  /* ── OTP input tab-through ── */
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    setOtpError(false)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  /* ── Step 2 verify ── */
  function handleVerify() {
    const code = otp.join('')
    // Demo: any 6-digit code works
    if (code.length === 6) {
      navigate('/dashboard')
    } else {
      setOtpError(true)
    }
  }

  function handleResend() {
    setOtp(Array(6).fill(''))
    setSeconds(119)
    setTimerActive(true)
    setOtpError(false)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  return (
    <div className="min-h-screen bg-aims-mint flex flex-col items-center justify-center p-md">

      {/* ── Card ── */}
      <div className="w-full max-w-[440px]">

        {/* ─── STEP 1: CREDENTIALS ─── */}
        <div
          className={cn(
            'bg-surface-container-lowest p-xl rounded-xl shadow-level-1 border border-outline-variant transition-all duration-300',
            step !== 'credentials' && 'hidden'
          )}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-xl">
            <ArdhiLogo variant="full" className="justify-center mb-md" />
            <div className="h-[2px] w-12 bg-primary mx-auto mt-md" />
            <p className="text-label-md text-on-surface-variant uppercase tracking-widest mt-sm">
              Ardhi Integrated Management System
            </p>
          </div>

          <form onSubmit={handleCredentials} className="space-y-lg">
            {/* Email */}
            <div className="space-y-sm">
              <label htmlFor="email" className="block text-label-md text-primary">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ardhi.go.ke"
                  className="w-full pl-10 pr-md py-md rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed/50 outline-none transition-all text-body-md bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-label-md text-primary">
                  Password
                </label>
                <a href="#" className="text-label-md text-primary-fixed-dim hover:text-primary transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-md rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed/50 outline-none transition-all text-body-md bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-md rounded-lg text-title-lg font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-sm"
            >
              Log In
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          <footer className="mt-xl pt-lg border-t border-outline-variant text-center">
            <p className="text-body-md text-on-surface-variant">
              Institutional trust &amp; secure land management.
            </p>
            <div className="flex items-center justify-center gap-md mt-sm flex-wrap">
              <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">security</span>
                Keycloak / MFA
              </span>
              <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                TLS Encrypted
              </span>
            </div>
          </footer>
        </div>

        {/* ─── STEP 2: MFA / OTP ─── */}
        <div
          className={cn(
            'bg-surface-container-lowest p-xl rounded-xl shadow-level-1 border border-outline-variant transition-all duration-300',
            step !== 'mfa' && 'hidden'
          )}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-xl">
            <ArdhiLogo variant="compact" className="justify-center" />
            <p className="text-label-md text-on-surface-variant uppercase tracking-widest mt-sm">
              Security Verification
            </p>
            <div className="h-[2px] w-12 bg-primary mx-auto mt-md" />
          </div>

          <div className="space-y-lg">
            <div className="text-center space-y-xs">
              <p className="text-title-lg font-semibold text-on-surface">Enter MFA Code</p>
              <p className="text-body-md text-on-surface-variant">
                We've sent a 6-digit code to{' '}
                <span className="font-semibold text-primary">{email || 'your email'}</span>.
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex justify-between gap-xs" role="group" aria-label="One-time passcode">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className={cn(
                    'w-12 h-14 text-center text-headline-md font-bold rounded-lg border bg-surface-bright outline-none transition-all',
                    otpError
                      ? 'border-aims-orange ring-2 ring-aims-orange/20 text-aims-orange'
                      : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed/50'
                  )}
                />
              ))}
            </div>

            {/* Error message */}
            {otpError && (
              <div className="flex items-center justify-center gap-xs bg-error-container/20 text-error border border-error/20 p-sm rounded-lg">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  report
                </span>
                <span className="text-label-md">Incorrect code. Please try again.</span>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerify}
              className="w-full bg-primary text-white py-md rounded-lg text-title-lg font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Verify Identity
            </button>

            {/* Timer + resend */}
            <div className="text-center pt-md space-y-sm">
              {seconds > 0 ? (
                <p className="text-label-md text-on-surface-variant">
                  Resend code in{' '}
                  <span className="font-bold text-primary">{formatTime(seconds)}</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary font-bold text-label-md hover:underline"
                >
                  Resend Code Now
                </button>
              )}

              <button
                onClick={() => { setStep('credentials'); setOtp(Array(6).fill('')); setOtpError(false) }}
                className="flex items-center justify-center mx-auto gap-xs text-on-surface-variant text-label-md hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Login
              </button>
            </div>
          </div>
        </div>

        {/* ── Tech badges ── */}
        <div className="flex justify-center flex-wrap gap-md mt-lg">
          {['FastAPI', 'Keycloak MFA', 'PostgreSQL', 'MinIO S3'].map((tech) => (
            <span key={tech} className="text-[10px] text-on-surface-variant bg-surface-container-lowest border border-outline-variant px-sm py-0.5 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
