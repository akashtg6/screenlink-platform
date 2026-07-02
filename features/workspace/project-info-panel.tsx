'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Calendar, MapPin, User } from 'lucide-react'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, PRIORITY_LABELS } from '@/types'

export function ProjectInfoPanel() {
  const { project } = useWorkspace()
  const tone = PROJECT_STATUS_TONE[project.status]
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project</div>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{project.name}</h2>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{project.code || project.id.slice(0, 8)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={tone === 'success' ? 'default' : tone === 'warning' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
        {project.priority && (
          <Badge variant="outline" className="text-[10px] uppercase">
            {PRIORITY_LABELS[project.priority]}
          </Badge>
        )}
      </div>

      <Separator />

      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</div>
        <ul className="space-y-1.5 text-sm">
          <Row icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={project.customer?.company || project.customer?.name} />
          <Row icon={<User className="h-3.5 w-3.5" />}      label="Consultant" value={project.customer?.consultant} />
          <Row icon={<User className="h-3.5 w-3.5" />}      label="Integrator" value={project.customer?.integrator} />
          <Row icon={<MapPin className="h-3.5 w-3.5" />}    label="Location" value={[project.customer?.city, project.customer?.country].filter(Boolean).join(', ')} />
        </ul>
      </section>

      <Separator />

      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Application</div>
        <p className="text-sm text-foreground/90 capitalize">{project.requirements?.application || '—'}</p>
      </section>

      <Separator />

      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Physical</div>
        <ul className="space-y-1.5 text-sm">
          <Row label="Dimensions" value={project.requirements?.display ? `${project.requirements.display.screenWidth || '—'} × ${project.requirements.display.screenHeight || '—'} ${project.requirements.display.measurementUnit || ''}` : '—'} />
          <Row label="Pixel pitch" value={project.requirements?.display?.pixelPitchPreference ? `${project.requirements.display.pixelPitchPreference} mm` : '—'} />
          <Row label="Cabinet size" value={project.requirements?.display?.cabinetSize} />
          <Row label="Orientation" value={project.requirements?.display?.orientation} />
        </ul>
      </section>

      <Separator />

      <section>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" /> Timeline
        </div>
        <ul className="space-y-1.5 text-sm">
          <Row label="Target date" value={project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString() : '—'} />
          <Row label="Last updated" value={new Date(project.updatedAt).toLocaleString()} />
          <Row label="Progress" value={`${project.progressPercent}%`} />
        </ul>
      </section>
    </div>
  )
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="text-right text-foreground/90 capitalize">{value || '—'}</span>
    </li>
  )
}
