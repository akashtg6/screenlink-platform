import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { WorkspaceShellCanvas } from '@/features/workspace/canvas'
import type { Customer, Project, Requirements } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

/**
 * Sprint 6A \u2014 Engineering Workspace page.
 *
 * Server-side auth guard + project fetch. The interactive canvas runs on the
 * client only (react-konva), imported dynamically inside `WorkspaceShellCanvas`.
 */
export default async function WorkspacePage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/projects/${id}/workspace`)

  const { data: row, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !row) return <NotFound id={id} />

  const project: Project = {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority ?? undefined,
    targetCompletionDate: row.target_completion_date ?? undefined,
    progressPercent: row.progress_percent ?? 0,
    customer: (row.customer as unknown as Customer) ?? { name: '' },
    requirements: (row.requirements as unknown as Requirements) ?? {},
    location: row.location ?? undefined,
    budgetUsd: row.budget_usd ?? undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-1rem)] max-w-none flex-col px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]">
              <ArrowLeft className="h-3.5 w-3.5" /> Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
            <div className="text-[10px] text-muted-foreground">
              Workspace \u00b7 <span className="font-mono">{project.code || project.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm" className="h-7 text-[11px]">Edit project</Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <WorkspaceShellCanvas project={project} />
      </div>
    </div>
  )
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Project not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The project <span className="font-mono">{id.slice(0, 8)}\u2026</span> doesn\u2019t exist or you don\u2019t have access.
      </p>
      <Link href="/projects" className="mt-4 inline-block text-sm text-accent underline">
        Back to projects
      </Link>
    </div>
  )
}
