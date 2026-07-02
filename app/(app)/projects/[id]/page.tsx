'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Copy, Archive, Trash2, Send, Building2, MapPin, Calendar, User, Layers } from 'lucide-react'
import { PageHeader } from '@/components/data-display/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProjectStatusBadge } from '@/features/projects/project-status-badge'
import { ConfirmationDialog } from '@/features/projects/dialogs/confirmation-dialog'
import { useProject } from '@/hooks/use-project'
import { useProjectRepository } from '@/hooks/use-project-repository'
import { formatCurrency, formatRelative, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { LoadingState } from '@/components/data-display/loading-state'
import { EmptyState } from '@/components/data-display/empty-state'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const repo = useProjectRepository()
  const { project, loading, refresh } = useProject(id)
  const [dialog, setDialog] = useState<'archive' | 'delete' | 'duplicate' | null>(null)

  if (loading) return <LoadingState rows={4} />
  if (!project) return <EmptyState title="Project not found" description="It may have been archived or deleted." action={{ label: 'Back to projects', href: '/projects' }} />

  const doArchive = async () => { if (repo) { await repo.archive(project.id); toast.success('Archived'); router.push('/projects') } }
  const doDelete = async () => { if (repo) { await repo.delete(project.id); toast.success('Deleted'); router.push('/projects') } }
  const doDuplicate = async () => { if (repo) { const d = await repo.duplicate(project.id); toast.success(`Duplicated as ${d.code}`); router.push(`/projects/${d.id}`) } }
  const doSubmit = async () => { if (repo) { await repo.submit(project.id); toast.success('Submitted for review'); refresh() } }

  const req = project.requirements
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-xs">
        <Button asChild variant="ghost" size="sm" className="h-7 -ml-2 gap-1"><Link href="/projects"><ArrowLeft className="h-3.5 w-3.5" /> Projects</Link></Button>
      </div>
      <PageHeader eyebrow={project.code} title={project.name} description={project.description}
        actions={<>
          {project.status === 'draft' && (<Button size="sm" onClick={doSubmit} className="gap-1.5"><Send className="h-3.5 w-3.5" /> Submit</Button>)}
          <Button asChild variant="outline" size="sm" className="gap-1.5"><Link href={`/projects/${project.id}/edit`}><Edit className="h-3.5 w-3.5" /> Edit</Link></Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('duplicate')} className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('archive')} className="gap-1.5"><Archive className="h-3.5 w-3.5" /> Archive</Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('delete')} className="gap-1.5 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </>} />

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <Card><CardHeader className="flex flex-row items-center justify-between border-b border-border"><CardTitle className="text-heading-sm">Overview</CardTitle><ProjectStatusBadge status={project.status} /></CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Row icon={<Building2 className="h-3.5 w-3.5" />} label="Customer" value={`${project.customer.name}${project.customer.company ? ` · ${project.customer.company}` : ''}`} />
                <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={project.location} />
                <Row icon={<Layers className="h-3.5 w-3.5" />} label="Application" value={String(req.application || '').replace(/_/g, ' ')} />
                <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Target completion" value={project.targetCompletionDate ? formatDate(project.targetCompletionDate) : '—'} />
                <Row icon={<User className="h-3.5 w-3.5" />} label="Consultant" value={project.customer.consultant} />
                <Row icon={<User className="h-3.5 w-3.5" />} label="Integrator" value={project.customer.integrator} />
              </div>
            </CardContent>
          </Card>

          <Card><CardHeader className="border-b border-border"><CardTitle className="text-heading-sm">Configuration</CardTitle></CardHeader>
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <Group title="Installation">
                <Row label="Types" value={(req.installation?.types || []).join(', ').replace(/_/g, ' ')} />
                <Row label="Mounting" value={req.installation?.mountingType} />
                <Row label="Maintenance" value={req.installation?.maintenanceAccess} />
              </Group>
              <Group title="Display">
                <Row label="Dimensions" value={req.display?.screenWidth && req.display?.screenHeight ? `${req.display.screenWidth} × ${req.display.screenHeight} ${req.display.measurementUnit}` : '—'} />
                <Row label="Pixel pitch" value={req.display?.pixelPitchPreference ? `P${req.display.pixelPitchPreference}` : undefined} />
                <Row label="Resolution" value={req.display?.preferredResolution} />
                <Row label="Orientation" value={req.display?.orientation} />
                <Row label="Quantity" value={req.display?.displayQuantity?.toString()} />
              </Group>
              <Group title="Viewing">
                <Row label="Distance" value={req.viewing?.nearestDistanceM || req.viewing?.farthestDistanceM ? `${req.viewing?.nearestDistanceM ?? '?'}–${req.viewing?.farthestDistanceM ?? '?'} m` : undefined} />
                <Row label="Content" value={req.viewing?.contentType} />
                <Row label="Ambient light" value={req.viewing?.ambientLight} />
                <Row label="Direct sun" value={req.viewing?.directSunlight ? 'Yes' : 'No'} />
                <Row label="Ops hrs/day" value={req.viewing?.operationHoursPerDay?.toString()} />
              </Group>
              <Group title="Electrical">
                <Row label="Voltage" value={req.electrical?.voltage} />
                <Row label="Available power" value={req.electrical?.availablePowerKw ? `${req.electrical.availablePowerKw} kW` : undefined} />
                <Row label="UPS" value={req.electrical?.ups ? 'Yes' : 'No'} />
                <Row label="Generator" value={req.electrical?.generator ? 'Yes' : 'No'} />
                <Row label="Internet" value={(req.electrical?.internet || []).join(', ').toUpperCase()} />
                <Row label="Remote monitor" value={req.electrical?.remoteMonitoring ? 'Required' : 'Not required'} />
              </Group>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card><CardHeader className="border-b border-border"><CardTitle className="text-heading-sm">Progress</CardTitle></CardHeader>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-baseline justify-between"><span className="text-xs text-muted-foreground">Completion</span><span className="font-mono text-lg font-semibold text-foreground">{project.progressPercent}%</span></div>
              <Progress value={project.progressPercent} className="h-1.5" />
              <Row label="Priority" value={project.priority} />
              <Row label="Budget" value={formatCurrency(project.budgetUsd)} />
              <Row label="Created" value={formatRelative(project.createdAt)} />
              <Row label="Updated" value={formatRelative(project.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationDialog open={dialog === 'archive'} onOpenChange={(o) => !o && setDialog(null)} title="Archive project?" description="Restorable later." confirmLabel="Archive" onConfirm={doArchive} />
      <ConfirmationDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)} title="Delete project?" description="This cannot be undone." confirmLabel="Delete permanently" destructive onConfirm={doDelete} />
      <ConfirmationDialog open={dialog === 'duplicate'} onOpenChange={(o) => !o && setDialog(null)} title="Duplicate project?" description="A new draft will be created." confirmLabel="Duplicate" onConfirm={doDuplicate} />
    </div>
  )
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="text-right font-medium text-foreground capitalize">{value ? value : '—'}</span>
    </div>
  )
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
