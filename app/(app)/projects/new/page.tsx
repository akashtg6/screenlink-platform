import { PageHeader } from '@/components/data-display/page-header'
import { ProjectWizard } from '@/features/projects/wizard/project-wizard'

export const metadata = { title: 'New Project' }

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Projects" title="New Project" description="Six-step engineering intake with autosave. Save a draft any time." />
      <ProjectWizard />
    </div>
  )
}
