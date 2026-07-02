'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, Download, PackageOpen } from 'lucide-react'
import { PageHeader } from '@/components/data-display/page-header'
import { EmptyState } from '@/components/data-display/empty-state'
import { ErrorState } from '@/components/data-display/error-state'
import { LoadingState } from '@/components/data-display/loading-state'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/features/projects/project-card'
import { ProjectToolbar, type SortKey } from '@/features/projects/project-toolbar'
import { ConfirmationDialog } from '@/features/projects/dialogs/confirmation-dialog'
import { useProjects } from '@/hooks/use-projects'
import { useProjectRepository } from '@/hooks/use-project-repository'
import type { Project, ProjectPriority, ProjectStatus } from '@/types'
import { toast } from 'sonner'

type DialogKind = 'archive' | 'delete' | 'duplicate' | null

export default function ProjectsPage() {
  const router = useRouter()
  const repo = useProjectRepository()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [priority, setPriority] = useState<ProjectPriority | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('updated_desc')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [dialog, setDialog] = useState<{ kind: DialogKind; project?: Project }>({ kind: null })

  const filter = useMemo(() => ({
    q: q || undefined,
    status: status === 'all' ? undefined : status,
    priority: priority === 'all' ? undefined : priority,
    sort,
    includeArchived: status === 'archived',
  }), [q, status, priority, sort])

  const { projects, loading, error, refresh } = useProjects(filter)

  async function doArchive() {
    if (!repo || !dialog.project) return
    await repo.archive(dialog.project.id)
    toast.success(`Project archived`)
    setDialog({ kind: null }); refresh()
  }
  async function doDelete() {
    if (!repo || !dialog.project) return
    await repo.delete(dialog.project.id)
    toast.success('Project deleted')
    setDialog({ kind: null }); refresh()
  }
  async function doDuplicate() {
    if (!repo || !dialog.project) return
    const dup = await repo.duplicate(dialog.project.id)
    toast.success(`Duplicated as ${dup.code}`)
    setDialog({ kind: null }); refresh()
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Engineering" title="Projects" description="Every LED and LCD engagement, versioned and auditable — from intake to delivery."
        actions={<>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button asChild size="sm" className="gap-1.5"><Link href="/projects/new"><PlusCircle className="h-3.5 w-3.5" /> New Project</Link></Button>
        </>} />

      <ProjectToolbar q={q} onQChange={setQ} status={status} onStatusChange={setStatus} priority={priority} onPriorityChange={setPriority} sort={sort} onSortChange={setSort} view={view} onViewChange={setView} />

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState onRetry={refresh} description={error} />
      ) : projects.length === 0 ? (
        <EmptyState icon={<PackageOpen className="h-5 w-5" />} title="No projects match your filters" description="Adjust the search or filters above — or start a new engineering project." action={{ label: 'New Project', href: '/projects/new' }} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} view="grid"
              onEdit={(pr) => router.push(`/projects/${pr.id}/edit`)}
              onDuplicate={(pr) => setDialog({ kind: 'duplicate', project: pr })}
              onArchive={(pr) => setDialog({ kind: 'archive', project: pr })}
              onDelete={(pr) => setDialog({ kind: 'delete', project: pr })} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} view="list"
              onEdit={(pr) => router.push(`/projects/${pr.id}/edit`)}
              onDuplicate={(pr) => setDialog({ kind: 'duplicate', project: pr })}
              onArchive={(pr) => setDialog({ kind: 'archive', project: pr })}
              onDelete={(pr) => setDialog({ kind: 'delete', project: pr })} />
          ))}
        </div>
      )}

      <ConfirmationDialog open={dialog.kind === 'archive'} onOpenChange={(o) => !o && setDialog({ kind: null })}
        title={`Archive ${dialog.project?.name}?`} description="You can restore it later from the archived filter."
        confirmLabel="Archive" onConfirm={doArchive} />
      <ConfirmationDialog open={dialog.kind === 'delete'} onOpenChange={(o) => !o && setDialog({ kind: null })}
        title={`Delete ${dialog.project?.name}?`} description="This action cannot be undone."
        confirmLabel="Delete permanently" destructive onConfirm={doDelete} />
      <ConfirmationDialog open={dialog.kind === 'duplicate'} onOpenChange={(o) => !o && setDialog({ kind: null })}
        title={`Duplicate ${dialog.project?.name}?`} description="A new draft will be created with the same configuration."
        confirmLabel="Duplicate" onConfirm={doDuplicate} />
    </div>
  )
}
