import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  icon: string
  badge?: ReactNode
  className?: string
}

export function StatCard({ label, value, icon, badge, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-aims-mint-card p-lg rounded-xl shadow-level-1 border border-aims-mint-border flex flex-col justify-between h-32 hover:shadow-md hover:-translate-y-0.5 transition-all',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-label-md text-primary font-bold uppercase tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-primary/40 text-[22px]">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-headline-md font-headline-md text-primary">{value}</span>
        {badge}
      </div>
    </div>
  )
}
