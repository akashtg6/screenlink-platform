'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Activity, AlertTriangle, CheckCircle2, Gauge, Info, Layers, Lightbulb, Ruler, Sparkles, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EngineeringResult } from '@/engineering-engine'
import { useEngineering } from '@/engineering-engine'
import { wizardValuesToProjectData } from '@/lib/engineering/wizard-to-engine'
import type { ProjectWizardValues } from '@/lib/validation/project-schemas'

interface Props {
  values: Partial<ProjectWizardValues>
  className?: string
  variant?: 'sidebar' | 'inline'
}

/**
 * MODULE 9 (Sprint 4B) — Engineering Summary Panel.
 * Reads wizard values, maps to engine input, and displays the live output
 * of the pure Engineering Engine. Recommendations, warnings and scores are
 * NEVER hardcoded here — they always come from the engine.
 */
export function EngineeringSummaryPanel({ values, className, variant = 'sidebar' }: Props) {
  // Reduce recalculation churn by memoising the engine input.
  const projectData = React.useMemo(() => wizardValuesToProjectData(values), [values])
  const result = useEngineering(projectData)

  if (!projectData || !result) {
    return (
      <Card className={cn('border-dashed border-border bg-muted/30 shadow-none', className)}>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Engineering summary
          </div>
          <p className="text-sm text-muted-foreground">
            Fill screen width, height and pixel pitch to see live engineering calculations,
            recommendations and an Engineering Score.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground/80">
            <li>• Screen dimensions & measurement unit</li>
            <li>• Pixel pitch (mm)</li>
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-border shadow-elevation-1', variant === 'sidebar' && 'lg:sticky lg:top-24', className)}>
      <CardContent className="space-y-5 p-5">
        <ScoreHeader result={result} />
        <Separator />
        <MetricsGrid result={result} />
        {result.errors.length + result.warnings.length + result.notes.length > 0 && (
          <>
            <Separator />
            <Alerts result={result} />
          </>
        )}
        {(result.recommendations?.length ?? 0) > 0 && (
          <>
            <Separator />
            <Recommendations result={result} />
          </>
        )}
        <Separator />
        <Footer result={result} />
      </CardContent>
    </Card>
  )
}

/* ----------------------------- Score ----------------------------- */

function ScoreHeader({ result }: { result: EngineeringResult }) {
  const score = result.score
  const overall = score?.overall ?? 0
  const grade = score?.grade ?? '—'
  const tone =
    overall >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
    overall >= 80 ? 'text-blue-600 dark:text-blue-400' :
    overall >= 70 ? 'text-amber-600 dark:text-amber-400' :
    overall >= 60 ? 'text-orange-600 dark:text-orange-400' :
                    'text-destructive'
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Engineering score
        </div>
        <StatusBadge ok={result.ok} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={cn('font-mono text-4xl font-bold leading-none', tone)}>{overall}</div>
          <div className="mt-1 text-xs text-muted-foreground">out of 100</div>
        </div>
        <div className={cn('flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold',
          overall >= 80 ? 'border-blue-500/40 bg-blue-500/5 text-blue-600 dark:border-blue-400/40 dark:text-blue-400' :
          overall >= 60 ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400' :
                          'border-destructive/40 bg-destructive/5 text-destructive')}>
          {grade}
        </div>
      </div>
      {score && (
        <div className="mt-4 space-y-2">
          <CategoryBar label="Display design"     value={score.categories.displayDesign} />
          <CategoryBar label="Viewing experience" value={score.categories.viewingExperience} />
          <CategoryBar label="Installation"       value={score.categories.installationEfficiency} />
          <CategoryBar label="Power efficiency"   value={score.categories.powerEfficiency} />
          <CategoryBar label="Maintainability"    value={score.categories.maintainability} />
        </div>
      )}
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

function StatusBadge({ ok }: { ok: boolean }) {
  return ok
    ? <Badge variant="secondary" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Valid</Badge>
    : <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Issues</Badge>
}

/* --------------------------- Metrics grid --------------------------- */

function MetricsGrid({ result }: { result: EngineeringResult }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Ruler className="h-3.5 w-3.5" /> Calculations
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Screen size" value={`${result.geometry.diagonalInch}"`} sub={`${result.geometry.areaSqM} m²`} />
        <Metric label="Aspect ratio" value={result.aspectRatio.humanReadable} sub={result.aspectRatio.isStandard ? 'standard' : 'non-standard'} />
        <Metric label="Resolution" value={result.resolution.shortName} sub={`${result.resolution.horizontalPixels}×${result.resolution.verticalPixels}`} />
        <Metric label="Total pixels" value={`${result.resolution.megapixels.toLocaleString()} MP`} sub={`${result.pixelDensity.pixelDensityPPI} PPI`} />

        {result.cabinet && (
          <>
            <Metric label="Cabinets" value={`${result.cabinet.horizontalCount} × ${result.cabinet.verticalCount}`} sub={`${result.cabinet.totalCabinets} total`} />
            <Metric label="Cabinet efficiency" value={`${result.cabinet.efficiencyPercent}%`} sub={result.cabinet.isEfficient ? 'efficient' : 'edge waste'} tone={result.cabinet.isEfficient ? 'good' : 'warn'} />
          </>
        )}
        {result.power && (
          <>
            <Metric label="Max power" value={`${(result.power.maxWatts / 1000).toFixed(2)} kW`} sub={`${result.power.wattsPerSqMMax} W/m²`} icon={<Zap className="h-3 w-3" />} />
            <Metric label="Annual energy" value={`${result.power.annualKWh.toLocaleString()} kWh`} sub={`${result.power.dailyKWh.toFixed(1)} kWh/day`} />
          </>
        )}
        {result.weight && (
          <Metric label="Total weight" value={`${result.weight.totalDisplayWeightKg.toLocaleString()} kg`} sub={`${result.weight.weightPerSqMKg} kg/m²`} icon={<Layers className="h-3 w-3" />} />
        )}
        {result.viewing && (
          <Metric
            label="Viewing"
            value={result.viewing.fitness}
            sub={`rec. ${result.viewing.recommendedDistanceM} m`}
            tone={
              result.viewing.fitness === 'ideal' ? 'good' :
              result.viewing.fitness === 'ok' ? 'neutral' :
              result.viewing.fitness === 'unspecified' ? 'muted' : 'warn'
            }
            icon={<Gauge className="h-3 w-3" />}
          />
        )}
      </div>
    </div>
  )
}

function Metric({
  label, value, sub, tone, icon,
}: {
  label: string
  value: string | number
  sub?: string
  tone?: 'good' | 'warn' | 'neutral' | 'muted'
  icon?: React.ReactNode
}) {
  const toneCls =
    tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
    tone === 'warn' ? 'text-amber-600 dark:text-amber-400' :
    tone === 'muted' ? 'text-muted-foreground' :
    'text-foreground'
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className={cn('font-mono text-sm font-semibold capitalize', toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

/* ----------------------------- Alerts ----------------------------- */

function Alerts({ result }: { result: EngineeringResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5" /> Findings
      </div>
      {result.errors.map((e) => (
        <Alert key={`err-${e.code}`} variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs">{e.code}</AlertTitle>
          <AlertDescription className="text-xs">{e.message}{e.suggestion && ` — ${e.suggestion}`}</AlertDescription>
        </Alert>
      ))}
      {result.warnings.map((w, i) => (
        <Alert key={`warn-${w.code || i}`} className="border-amber-500/30 bg-amber-500/5 py-2 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-xs">{w.code || w.severity}</AlertTitle>
          <AlertDescription className="text-xs">{w.message}{w.suggestion && ` — ${w.suggestion}`}</AlertDescription>
        </Alert>
      ))}
      {result.notes.map((n) => (
        <Alert key={`note-${n.slice(0, 20)}`} className="border-blue-500/30 bg-blue-500/5 py-2 text-blue-900 dark:text-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs">{n}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

/* --------------------------- Recommendations --------------------------- */

function Recommendations({ result }: { result: EngineeringResult }) {
  const recs = result.recommendations ?? []
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5" /> Recommendations ({recs.length})
      </div>
      <Accordion type="multiple" className="w-full">
        {recs.map((r) => (
          <AccordionItem key={r.id} value={r.id} className="border-border">
            <AccordionTrigger className="py-2 text-left hover:no-underline">
              <div className="flex flex-1 items-start gap-2 pr-2">
                <PriorityDot priority={r.priority} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">{r.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    <span className="font-mono">{String(r.field)}</span>
                    {r.currentValue !== undefined && r.currentValue !== null && (
                      <> · from <span className="font-mono">{String(r.currentValue)}</span></>
                    )}
                    {' → '}
                    <span className="font-mono font-semibold text-accent">{String(r.suggested)}</span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1 text-xs text-muted-foreground">
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2.5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why</div>
                  <p className="mt-0.5 text-foreground/90">{r.reason}</p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Engineering rationale</div>
                  <p className="mt-0.5">{r.engineeringExplanation}</p>
                </div>
                {r.suggestedAction && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested action</div>
                    <p className="mt-0.5 text-foreground/90">{r.suggestedAction}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <Badge variant="outline" className="uppercase tracking-wider">{r.priority}</Badge>
                  <span className="text-muted-foreground">confidence {Math.round(r.confidence * 100)}%</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function PriorityDot({ priority }: { priority: 'critical' | 'high' | 'medium' | 'low' }) {
  const cls =
    priority === 'critical' ? 'bg-destructive' :
    priority === 'high' ? 'bg-amber-500' :
    priority === 'medium' ? 'bg-blue-500' :
    'bg-muted-foreground'
  return <span className={cn('mt-1 inline-block h-2 w-2 shrink-0 rounded-full', cls)} aria-hidden />
}

/* ----------------------------- Footer ----------------------------- */

function Footer({ result }: { result: EngineeringResult }) {
  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
      <span>Engine {result.engineVersion}</span>
      <span>{result.calculationTimeMs.toFixed(2)} ms</span>
    </div>
  )
}
