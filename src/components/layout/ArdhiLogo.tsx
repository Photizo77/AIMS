import { cn } from '@/lib/utils'

interface ArdhiLogoProps {
  /** 'full' shows icon + ARDHI + tagline, 'compact' shows icon + ARDHI only, 'icon' shows icon only */
  variant?: 'full' | 'compact' | 'icon'
  /** Invert colours for use on dark/navy backgrounds */
  inverted?: boolean
  className?: string
}

export function ArdhiLogo({ variant = 'full', inverted = false, className }: ArdhiLogoProps) {
  const textColor  = inverted ? 'text-white'               : 'text-primary'
  const subColor   = inverted ? 'text-white/70'            : 'text-on-surface-variant'
  const strokeMain = inverted ? '#ffffff'                  : '#1a2a4a'
  const strokeAccR = '#e8302a'
  const fillGreen  = inverted ? 'rgba(255,255,255,0.4)'   : '#4caf50'

  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      {/* Icon SVG */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ARDHI logo icon"
        className="shrink-0"
      >
        {/* Red arc */}
        <path
          d="M16 42 A24 24 0 0 1 64 42"
          stroke={strokeAccR}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Green land ellipse */}
        <ellipse cx="40" cy="66" rx="28" ry="9" fill={fillGreen} />
        {/* Tree trunk */}
        <rect x="38" y="48" width="4" height="18" rx="2" fill={strokeMain} />
        {/* Roots */}
        <path d="M40 65 Q32 69 24 71" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 65 Q34 70 28 75" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 65 Q48 69 56 71" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 65 Q46 70 52 75" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
        {/* Center person body */}
        <circle cx="40" cy="26" r="5" fill={strokeMain} />
        {/* Horizontal arms + scale bar */}
        <line x1="16" y1="36" x2="64" y2="36" stroke={strokeMain} strokeWidth="3" strokeLinecap="round" />
        {/* Left scale */}
        <line x1="20" y1="36" x2="20" y2="46" stroke={strokeMain} strokeWidth="2" strokeLinecap="round" />
        <path d="M14 46 Q20 44 26 46" stroke={strokeMain} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Right scale */}
        <line x1="60" y1="36" x2="60" y2="46" stroke={strokeMain} strokeWidth="2" strokeLinecap="round" />
        <path d="M54 46 Q60 44 66 46" stroke={strokeMain} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Left person */}
        <circle cx="22" cy="24" r="4" fill={strokeMain} />
        <path d="M22 28 L22 36" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
        {/* Right person */}
        <circle cx="58" cy="24" r="4" fill={strokeMain} />
        <path d="M58 28 L58 36" stroke={strokeMain} strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Text */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-extrabold tracking-wide', textColor,
            variant === 'compact' ? 'text-xl' : 'text-2xl'
          )}>
            ARDHI
          </span>
          {variant === 'full' && (
            <span className={cn('text-[10px] font-semibold tracking-widest mt-0.5', subColor)}>
              Research. Advocacy. Innovation
            </span>
          )}
        </div>
      )}
    </div>
  )
}
