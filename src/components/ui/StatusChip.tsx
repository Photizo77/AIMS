import { cn } from '@/lib/utils'

type ChipVariant = 'pending' | 'completed' | 'info' | 'review' | 'blocked' | 'processing'

interface StatusChipProps {
  variant: ChipVariant
  label: string
  className?: string
  pulse?: boolean
}

const variantStyles: Record<ChipVariant, string> = {
  pending:    'bg-[rgba(235,59,20,0.10)] text-aims-orange',
  completed:  'bg-[rgba(40,107,37,0.10)] text-forest-green',
  info:       'bg-primary-fixed text-primary',
  review:     'bg-surface-container-high text-primary',
  blocked:    'bg-error-container text-error',
  processing: 'bg-primary/10 text-primary',
}

export function StatusChip({ variant, label, className, pulse }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-md py-[3px] rounded-full text-label-md font-bold',
        variantStyles[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {label}
    </span>
  )
}
