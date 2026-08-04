import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number          // 0–100
  className?: string
  barClassName?: string
  showLabel?: boolean
}

function barColor(value: number): string {
  if (value >= 90) return 'bg-aims-orange'
  if (value >= 80) return 'bg-primary'
  return 'bg-forest-green'
}

export function ProgressBar({ value, className, barClassName, showLabel }: ProgressBarProps) {
  return (
    <div className={cn('flex items-center gap-sm', className)}>
      <div className="flex-1 bg-surface-container rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor(value), barClassName)}
          style={{ width: `${Math.min(100, value)}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-label-md text-on-surface-variant w-8 text-right shrink-0">{value}%</span>
      )}
    </div>
  )
}
