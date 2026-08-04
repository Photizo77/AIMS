import { cn } from '@/lib/utils'

interface FABProps {
  onClick?: () => void
  icon?: string
  label?: string
  className?: string
}

export function FAB({ onClick, icon = 'add', label, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? 'Action'}
      className={cn(
        'fixed bottom-lg right-lg z-50 w-14 h-14 bg-primary text-white rounded-full shadow-2xl',
        'flex items-center justify-center hover:scale-110 active:scale-95 transition-all',
        className
      )}
    >
      <span className="material-symbols-outlined text-[28px]">{icon}</span>
    </button>
  )
}
