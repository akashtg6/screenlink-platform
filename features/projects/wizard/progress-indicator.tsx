'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStepDef { id: number; label: string; description?: string; icon?: React.ComponentType<{ className?: string }> }

interface Props {
  steps: WizardStepDef[]
  current: number
  progressPercent: number
  onSelect?: (n: number) => void
}

export function ProgressIndicator({ steps, current, progressPercent, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall progress</span>
          <span className="font-mono text-sm font-semibold text-foreground">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <ol className="space-y-1">
        {steps.map((s) => {
          const active = s.id === current
          const complete = s.id < current
          const Icon = s.icon
          return (
            <li key={s.id}>
              <button type="button" onClick={() => onSelect?.(s.id)} disabled={!complete && !active}
                className={cn('flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active ? 'border-primary/40 bg-primary/5' : complete ? 'border-border bg-card hover:bg-muted' : 'border-dashed border-border bg-card/40')}>
                <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset',
                  active ? 'bg-primary text-primary-foreground ring-primary'
                  : complete ? 'bg-success text-success-foreground ring-success'
                  : 'bg-muted text-muted-foreground ring-border')}>
                  {complete ? <Check className="h-4 w-4" /> : (Icon ? <Icon className="h-4 w-4" /> : s.id)}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>Step {s.id} · {s.label}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
