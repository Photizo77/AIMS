import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-xl">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-primary">{title}</h1>
        {subtitle && <p className="text-body-lg text-on-surface-variant mt-xs">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-sm flex-wrap">{actions}</div>}
    </div>
  )
}
