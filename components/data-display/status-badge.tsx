import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: 'bg-muted text-muted-foreground ring-border',
  in_review: 'bg-warning/10 text-warning ring-warning/30',
  approved: 'bg-info/10 text-info ring-info/30',
  delivered: 'bg-success/10 text-success ring-success/30',
  archived: 'bg-secondary text-secondary-foreground ring-border',
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  delivered: 'Delivered',
  archived: 'Archived',
}

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}
