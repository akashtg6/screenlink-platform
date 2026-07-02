'use client'

import { cn } from '@/lib/utils'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, type ProjectStatus } from '@/types'

const TONE_STYLES: Record<string, string> = {
  neutral: 'bg-muted text-muted-foreground ring-border',
  warning: 'bg-warning/10 text-warning ring-warning/30',
  info:    'bg-accent/10 text-accent-foreground ring-accent/30 dark:text-accent',
  success: 'bg-success/10 text-success ring-success/30',
  muted:   'bg-secondary text-secondary-foreground ring-border',
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
      TONE_STYLES[PROJECT_STATUS_TONE[status]], className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  )
}
