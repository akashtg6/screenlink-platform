import { PageHeader } from '@/components/data-display/page-header'
import { ProjectsTable } from '@/features/projects/projects-table'
import { Button } from '@/components/ui/button'
import { PlusCircle, Download } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Projects' }

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Engineering"
        title="Projects"
        description="Every LED and LCD engagement, versioned and auditable — from intake to delivery."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/projects/new">
                <PlusCircle className="h-3.5 w-3.5" /> New Project
              </Link>
            </Button>
          </>
        }
      />
      <ProjectsTable />
    </div>
  )
}
