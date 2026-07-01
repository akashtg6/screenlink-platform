import { PageHeader } from '@/components/data-display/page-header'
import { ProjectWizard } from '@/features/projects/project-wizard'

export const metadata = { title: 'New Project' }

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="New Project"
        description="Structured intake for a new display engineering engagement."
      />
      <ProjectWizard />
    </div>
  )
}
