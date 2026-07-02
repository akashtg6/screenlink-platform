'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { CabinetGrid } from './cabinet-grid'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Gauge, Info, Lightbulb, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EngineeringWorkspace() {
  const { engineering, isReady } = useWorkspace()

  if (!isReady || !engineering) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Fill screen dimensions, pixel pitch and cabinet size to see engineering calculations here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header — score */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Engineering</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Live design</h1>
        </div>
        <div className="flex items-center gap-4">
          {engineering.score && (
            <>
              <ScoreBadge overall={engineering.score.overall} grade={engineering.score.grade} />
              <StatusBadge ok={engineering.ok} />
            </>
          )}
        </div>
      </div>

      {/* Cabinet grid — the flagship visualisation */}
      <CabinetGrid geometry={engineering.geometry} cabinet={engineering.cabinet} height={420} />

      {/* Metric strip */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Screen size" value={`${engineering.geometry.diagonalInch}"`} sub={`${engineering.geometry.areaSqM} m²`} />
        <Metric label="Aspect ratio" value={engineering.aspectRatio.humanReadable} sub={engineering.aspectRatio.isStandard ? 'standard' : 'non-standard'} />
        <Metric label="Resolution" value={engineering.resolution.shortName} sub={`${engineering.resolution.horizontalPixels}×${engineering.resolution.verticalPixels}`} />
        <Metric label="Density" value={`${engineering.pixelDensity.pixelDensityPPI} PPI`} sub={`${(engineering.pixelDensity.totalLEDs / 1e6).toFixed(2)} M LEDs`} />

        {engineering.cabinet && (
          <>
            <Metric label="Cabinet grid" value={`${engineering.cabinet.horizontalCount} × ${engineering.cabinet.verticalCount}`} sub={`${engineering.cabinet.totalCabinets} total`} />
            <Metric label="Efficiency" value={`${engineering.cabinet.efficiencyPercent}%`} sub={engineering.cabinet.isEfficient ? 'efficient' : 'edge waste'} tone={engineering.cabinet.isEfficient ? 'good' : 'warn'} />
          </>
        )}
        {engineering.power && (
          <>
            <Metric label="Max power" value={`${(engineering.power.maxWatts / 1000).toFixed(2)} kW`} sub={`${engineering.power.wattsPerSqMMax} W/m²`} icon={<Zap className="h-3 w-3" />} />
            <Metric label="Annual energy" value={`${engineering.power.annualKWh.toLocaleString()} kWh`} sub={`${engineering.power.dailyKWh.toFixed(1)} kWh/day`} />
          </>
        )}
        {engineering.weight && (
          <Metric label="Weight" value={`${engineering.weight.totalDisplayWeightKg.toLocaleString()} kg`} sub={`${engineering.weight.weightPerSqMKg} kg/m²`} />
        )}
        {engineering.viewing && (
          <Metric label="Viewing" value={engineering.viewing.fitness} sub={`rec ${engineering.viewing.recommendedDistanceM} m`} tone={engineering.viewing.fitness === 'ideal' ? 'good' : engineering.viewing.fitness === 'ok' ? 'neutral' : 'warn'} icon={<Gauge className="h-3 w-3" />} />
        )}
      </div>

      {/* Score bars */}
      {engineering.score && (
        <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <CategoryBar label="Display design" value={engineering.score.categories.displayDesign} />
          <CategoryBar label="Viewing"        value={engineering.score.categories.viewingExperience} />
          <CategoryBar label="Installation"   value={engineering.score.categories.installationEfficiency} />
          <CategoryBar label="Power"          value={engineering.score.categories.powerEfficiency} />
          <CategoryBar label="Maintainability" value={engineering.score.categories.maintainability} />
        </div>
      )}

      {/* Findings */}
      {(engineering.errors.length + engineering.warnings.length + engineering.notes.length) > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" /> Findings
          </div>
          <div className="space-y-2">
            {engineering.errors.map((e) => (
              <Alert key={`err-${e.code}`} variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs">{e.code}</AlertTitle>
                <AlertDescription className="text-xs">{e.message}{e.suggestion && ` — ${e.suggestion}`}</AlertDescription>
              </Alert>
            ))}
            {engineering.warnings.map((w, i) => (
              <Alert key={`warn-${w.code || i}`} className="border-amber-500/30 bg-amber-500/5 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-xs">{w.code || w.severity}</AlertTitle>
                <AlertDescription className="text-xs">{w.message}{w.suggestion && ` — ${w.suggestion}`}</AlertDescription>
              </Alert>
            ))}
            {engineering.notes.map((n) => (
              <Alert key={n.slice(0, 30)} className="border-blue-500/30 bg-blue-500/5 py-2">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs">{n}</AlertDescription>
              </Alert>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {(engineering.recommendations?.length ?? 0) > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" /> Recommendations
          </div>
          <div className="space-y-2">
            {(engineering.recommendations ?? []).map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-card p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('inline-block h-2 w-2 rounded-full',
                    r.priority === 'critical' ? 'bg-destructive' :
                    r.priority === 'high' ? 'bg-amber-500' :
                    r.priority === 'medium' ? 'bg-blue-500' : 'bg-muted-foreground',
                  )} />
                  <span className="text-sm font-medium">{r.title}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase">{r.priority}</Badge>
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {String(r.field)} · from {String(r.currentValue ?? '—')} → <span className="font-semibold text-accent">{String(r.suggested)}</span>
                </div>
                <p className="mt-2 text-muted-foreground"><strong className="text-foreground">Why:</strong> {r.reason}</p>
                <p className="mt-1 text-muted-foreground"><strong className="text-foreground">Rationale:</strong> {r.engineeringExplanation}</p>
                {r.suggestedAction && <p className="mt-1 text-muted-foreground"><strong className="text-foreground">Action:</strong> {r.suggestedAction}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Engineering Engine {engineering.engineVersion}</span>
        <span>{engineering.calculationTimeMs.toFixed(2)} ms</span>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, tone, icon }: { label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'neutral'; icon?: React.ReactNode }) {
  const toneCls = tone === 'good' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className={cn('mt-1 font-mono text-sm font-semibold capitalize', toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  )
}

function ScoreBadge({ overall, grade }: { overall: number; grade: string }) {
  const tone = overall >= 90 ? 'text-emerald-600' : overall >= 80 ? 'text-blue-600' : overall >= 70 ? 'text-amber-600' : 'text-destructive'
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score</span>
      <span className={cn('font-mono text-lg font-bold', tone)}>{overall}</span>
      <span className="text-sm font-semibold text-muted-foreground">/</span>
      <span className="font-mono text-sm font-bold">{grade}</span>
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok
    ? <Badge variant="secondary" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Valid</Badge>
    : <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Issues</Badge>
}
