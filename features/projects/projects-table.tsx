'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, MoreHorizontal, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/data-display/status-badge'
import { EmptyState } from '@/components/data-display/empty-state'
import { LoadingState } from '@/components/data-display/loading-state'
import { useProjects } from '@/hooks/use-projects'
import type { ProjectStatus } from '@/types'
import { formatCurrency, formatRelative } from '@/utils/format'

export function ProjectsTable() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')

  const filter = useMemo(
    () => ({ q: q || undefined, status: status === 'all' ? undefined : status }),
    [q, status],
  )
  const { projects, loading } = useProjects(filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project, code or customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | 'all')}>
            <SelectTrigger className="h-9 w-[160px]">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-6"><LoadingState rows={5} /></div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title="No projects match your filters"
            description="Try clearing filters or start a new engineering project."
            action={{ label: 'New Project', href: '/projects/new' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[300px]">Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Display</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <Link href={`/projects/${p.id}`} className="font-medium text-foreground hover:underline">
                        {p.name}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{p.customer.company || p.customer.name}</span>
                      <span className="text-xs text-muted-foreground">{p.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <span className="text-sm capitalize text-foreground">{p.requirements.displayType.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.requirements.aspectRatio || '—'}
                        {p.requirements.pixelPitchMm ? ` · P${p.requirements.pixelPitchMm}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right font-mono text-sm text-foreground">
                    {formatCurrency(p.budgetUsd)}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {formatRelative(p.updatedAt)}
                  </TableCell>
                  <TableCell className="align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Open</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Export BOQ</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
