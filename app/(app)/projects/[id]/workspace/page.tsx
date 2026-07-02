import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { WorkspaceProvider } from '@/features/workspace/workspace-provider'
import { WorkspaceShell } from '@/features/workspace/workspace-shell'
import type { Customer, Project, Requirements } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function WorkspacePage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  // Auth guard — middleware also enforces this; belt-and-braces here.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/projects/${params.id}/workspace`)

  const { data: row, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !row) {
    return <NotFound id={params.id} />
  }

  const project: Project = {
    id: row.id, organizationId: row.organization_id, code: row.code, name: row.name,
    description: row.description ?? undefined, status: row.status, priority: row.priority ?? undefined,
    targetCompletionDate: row.target_completion_date ?? undefined,
    progressPercent: row.progress_percent ?? 0,
    customer: (row.customer as unknown as Customer) ?? { name: '' },
    requirements: (row.requirements as unknown as Requirements) ?? {},
    location: row.location ?? undefined,
    budgetUsd: row.budget_usd ?? undefined,
    createdBy: row.created_by, updatedBy: row.updated_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }

  return (
    <div className="container mx-auto max-w-none px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
            <div className="text-[11px] text-muted-foreground">
              Workspace · <span className="font-mono">{project.code || project.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <Link href={`/projects/${project.id}/edit`}>
          <Button variant="outline" size="sm">Edit project</Button>
        </Link>
      </div>

      <WorkspaceProvider project={project}>
        <WorkspaceShell />
      </WorkspaceProvider>
    </div>
  )
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Project not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The project <span className="font-mono">{id.slice(0, 8)}…</span> doesn’t exist or you don’t have access.</p>
      <Link href="/projects" className="mt-4 inline-block text-sm text-accent underline">Back to projects</Link>
    </div>
  )
}
