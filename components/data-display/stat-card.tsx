import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  delta?: { value: string; direction: 'up' | 'down' | 'flat' }
  hint?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, delta, hint, icon, className }: StatCardProps) {
  const dirClass =
    delta?.direction === 'up'
      ? 'text-success'
      : delta?.direction === 'down'
      ? 'text-destructive'
      : 'text-muted-foreground'

  const DirIcon =
    delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <p className="text-display-md font-semibold tracking-tight text-foreground">{value}</p>
        {delta && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', dirClass)}>
            <DirIcon className="h-3.5 w-3.5" />
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
