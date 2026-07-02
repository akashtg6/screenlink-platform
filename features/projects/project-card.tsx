'use client'

import Link from 'next/link'
import { MoreHorizontal, Building2, MapPin, Calendar, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'
import { formatRelative, formatCurrency } from '@/utils/format'
import { ProjectStatusBadge } from './project-status-badge'

interface Props {
  project: Project
  view?: 'grid' | 'list'
  onOpen?: (p: Project) => void
  onEdit?: (p: Project) => void
  onDuplicate?: (p: Project) => void
  onArchive?: (p: Project) => void
  onDelete?: (p: Project) => void
  className?: string
}

export function ProjectCard({ project, view = 'grid', onEdit, onDuplicate, onArchive, onDelete, className }: Props) {
  if (view === 'list') return <ProjectListItem project={project} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} className={className} />

  return (
    <div className={cn('group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2', className)}>
      <div className="relative h-24 bg-gradient-to-br from-primary/8 to-accent/10 grid-pattern">
        <div className="absolute right-3 top-3">
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="absolute left-3 bottom-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {project.code}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/projects/${project.id}`} className="line-clamp-2 flex-1 text-sm font-semibold text-foreground hover:text-primary">
            {project.name}
          </Link>
          <RowActions project={project} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} />
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {project.customer.company && (<div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> <span className="truncate">{project.customer.company}</span></div>)}
          {project.location && (<div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> <span className="truncate">{project.location}</span></div>)}
          {project.requirements?.installation?.types?.[0] && (<div className="flex items-center gap-1.5"><Layers className="h-3 w-3" /> <span className="capitalize">{project.requirements.installation.types.join(', ').replace(/_/g, ' ')}</span></div>)}
          <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Updated {formatRelative(project.updatedAt)}</div>
        </div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>Progress</span><span className="font-mono text-foreground">{project.progressPercent}%</span></div>
          <Progress value={project.progressPercent} className="h-1" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground">{formatCurrency(project.budgetUsd)}</span>
          <span className="capitalize">{project.priority ?? '—'} priority</span>
        </div>
      </div>
    </div>
  )
}

function ProjectListItem({ project, onEdit, onDuplicate, onArchive, onDelete, className }: Props) {
  return (
    <Link href={`/projects/${project.id}`} className={cn('group flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-elevation-1 transition-all hover:bg-muted/30', className)}>
      <div className="grid-pattern h-10 w-10 flex-shrink-0 rounded bg-primary/10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{project.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{project.code}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {project.customer.company || project.customer.name} · {project.location || '—'} · {formatRelative(project.updatedAt)}
        </div>
      </div>
      <div className="hidden w-40 shrink-0 md:block">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground"><span>Progress</span><span className="font-mono text-foreground">{project.progressPercent}%</span></div>
        <Progress value={project.progressPercent} className="mt-1 h-1" />
      </div>
      <ProjectStatusBadge status={project.status} className="hidden md:inline-flex" />
      <span className="hidden shrink-0 font-mono text-sm text-foreground md:inline">{formatCurrency(project.budgetUsd)}</span>
      <div onClick={(e) => e.preventDefault()}>
        <RowActions project={project} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} />
      </div>
    </Link>
  )
}

function RowActions({ project, onEdit, onDuplicate, onArchive, onDelete }: Omit<Props, 'view'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild><Link href={`/projects/${project.id}`}>Open</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(project)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(project)}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onArchive?.(project)}>{project.status === 'archived' ? 'Restore' : 'Archive'}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete?.(project)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
