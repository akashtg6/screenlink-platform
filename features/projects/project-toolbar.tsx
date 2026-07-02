'use client'

import { Search, Filter, LayoutGrid, List, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ProjectStatus, ProjectPriority } from '@/types'

export type SortKey = 'updated_desc' | 'created_desc' | 'name_asc' | 'name_desc' | 'progress_desc'

interface Props {
  q: string; onQChange: (v: string) => void
  status: ProjectStatus | 'all'; onStatusChange: (v: ProjectStatus | 'all') => void
  priority: ProjectPriority | 'all'; onPriorityChange: (v: ProjectPriority | 'all') => void
  sort: SortKey; onSortChange: (v: SortKey) => void
  view: 'grid' | 'list'; onViewChange: (v: 'grid' | 'list') => void
}

export function ProjectToolbar(p: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, code, customer or location…" value={p.q} onChange={(e) => p.onQChange(e.target.value)} className="h-9 pl-8" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={p.status} onValueChange={(v) => p.onStatusChange(v as ProjectStatus | 'all')}>
          <SelectTrigger className="h-9 w-[150px]"><Filter className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={p.priority} onValueChange={(v) => p.onPriorityChange(v as ProjectPriority | 'all')}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={p.sort} onValueChange={(v) => p.onSortChange(v as SortKey)}>
          <SelectTrigger className="h-9 w-[170px]"><ArrowUpDown className="mr-1.5 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Recently updated</SelectItem>
            <SelectItem value="created_desc">Recently created</SelectItem>
            <SelectItem value="name_asc">Name (A–Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z–A)</SelectItem>
            <SelectItem value="progress_desc">Progress</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          <Button variant="ghost" size="icon" onClick={() => p.onViewChange('grid')} className={cn('h-8 w-8', p.view === 'grid' && 'bg-muted')} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => p.onViewChange('list')} className={cn('h-8 w-8', p.view === 'list' && 'bg-muted')} aria-label="List view"><List className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}
