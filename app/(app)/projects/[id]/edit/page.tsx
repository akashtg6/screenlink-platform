'use client'

import { use } from 'react'
import { PageHeader } from '@/components/data-display/page-header'
import { ProjectWizard } from '@/features/projects/wizard/project-wizard'
import { useProject } from '@/hooks/use-project'
import { LoadingState } from '@/components/data-display/loading-state'
import { EmptyState } from '@/components/data-display/empty-state'

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { project, loading } = useProject(id)
  if (loading) return <LoadingState rows={4} />
  if (!project) return <EmptyState title="Project not found" description="It may have been archived or deleted." action={{ label: 'Back to projects', href: '/projects' }} />
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={project.code} title={`Edit — ${project.name}`} description="Continue where you left off. Autosave is on." />
      <ProjectWizard initialProject={project} />
    </div>
  )
}
