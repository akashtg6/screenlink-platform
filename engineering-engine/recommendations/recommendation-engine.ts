import type { ProjectData } from '../models/project-data'
import type { EngineeringResult } from '../models/engineering-result'
import type { RuleFinding } from '../rules/rules-engine'
import { suggestedPitchForApplication } from '../rules/default-rules'
import { BRIGHTNESS_DEFAULTS } from '../constants/engineering-defaults'

export interface Recommendation {
  id: string
  title: string
  field: string
  suggested: string | number | boolean
  currentValue?: string | number | boolean | null
  reason: string
  engineeringExplanation: string
  suggestedAction: string
  confidence: number   // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * MODULE 6 (4B) — Recommendation Engine.
 * Consumes rule findings plus raw application/environment/content signals
 * to produce a de-duplicated list of actionable recommendations.
 *
 * @pure
 */
export function generateRecommendations(input: ProjectData, ctx: EngineeringResult, findings: RuleFinding[]): Recommendation[] {
  const out: Recommendation[] = []
  const seen = new Set<string>()

  // 1) Recommendations from rule findings
  for (const f of findings) {
    if (!f.recommendation) continue
    const key = `${f.recommendation.field}:${f.recommendation.suggested}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: `REC_${f.ruleId}`,
      title: rulePrettyTitle(f.ruleId, f.recommendation.field),
      field: f.recommendation.field ?? 'unknown',
      suggested: f.recommendation.suggested,
      currentValue: (input as unknown as Record<string, unknown>)[f.recommendation.field ?? ''] as string | number | boolean | null,
      reason: f.message,
      engineeringExplanation: f.explanation,
      suggestedAction: f.suggestion ?? '',
      confidence: f.recommendation.confidence,
      priority: sevToPriority(f.severity),
    })
  }

  // 2) Proactive pitch suggestion by application when nothing has flagged it
  if (input.application && !seen.has('pixelPitchMm:')) {
    const bucket = suggestedPitchForApplication(input.application)
    if (bucket && input.pixelPitchMm && (input.pixelPitchMm < bucket.min || input.pixelPitchMm > bucket.max)) {
      const key = `pixelPitchMm:${bucket.ideal}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push({
          id: 'REC_APPLICATION_PITCH',
          title: 'Adjust pixel pitch to match application',
          field: 'pixelPitchMm',
          suggested: bucket.ideal,
          currentValue: input.pixelPitchMm,
          reason: `For “${input.application}”, typical pitch range is ${bucket.min}–${bucket.max} mm.`,
          engineeringExplanation: `Applications in “${input.application}” spaces have well-established pitch conventions grounded in typical viewing distances and content type.`,
          suggestedAction: `Set pixel pitch to ${bucket.ideal} mm (ideal for ${input.application}).`,
          confidence: 0.7,
          priority: 'medium',
        })
      }
    }
  }

  // 3) Brightness suggestion for environment
  if (input.environment && input.brightnessNits === undefined) {
    const bucket = BRIGHTNESS_DEFAULTS[input.environment as keyof typeof BRIGHTNESS_DEFAULTS]
    if (bucket) {
      const key = `brightnessNits:${bucket.ideal}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push({
          id: 'REC_ENVIRONMENT_BRIGHTNESS',
          title: `Set brightness for ${input.environment} environment`,
          field: 'brightnessNits',
          suggested: bucket.ideal,
          currentValue: null,
          reason: `No brightness set. ${input.environment} typically needs ${bucket.ideal} nits.`,
          engineeringExplanation: `Ambient light on “${input.environment}” surfaces requires enough display luminance to maintain perceived contrast.`,
          suggestedAction: `Choose panels rated for ${bucket.low}–${bucket.high} nits (ideal ${bucket.ideal}).`,
          confidence: 0.75,
          priority: 'medium',
        })
      }
    }
  }

  // 4) Orientation guidance based on aspect ratio + application
  if (!input.orientation) {
    const ratio = ctx.aspectRatio.actualRatio
    if (ratio && ratio > 1.5) {
      out.push({
        id: 'REC_ORIENTATION_LANDSCAPE',
        title: 'Orientation: landscape',
        field: 'orientation', suggested: 'landscape', currentValue: null,
        reason: `Aspect ratio ${ctx.aspectRatio.humanReadable} favours a landscape mount.`,
        engineeringExplanation: 'Wide-canvas ratios (16:9, 21:9, 32:9) are always mounted landscape unless content is portrait-authored (e.g. digital signage).',
        suggestedAction: 'Mount landscape.', confidence: 0.9, priority: 'low',
      })
    } else if (ratio && ratio < 0.8) {
      out.push({
        id: 'REC_ORIENTATION_PORTRAIT',
        title: 'Orientation: portrait',
        field: 'orientation', suggested: 'portrait', currentValue: null,
        reason: `Aspect ratio ${ctx.aspectRatio.humanReadable} favours a portrait mount.`,
        engineeringExplanation: 'Tall canvases are typical for wayfinding, menu boards and lift lobbies.',
        suggestedAction: 'Mount portrait.', confidence: 0.9, priority: 'low',
      })
    }
  }

  // 5) Cabinet size upgrade path
  if (ctx.cabinet?.suggestedCabinet) {
    out.push({
      id: 'REC_CABINET_SIZE',
      title: 'Adopt tiling-friendly cabinet size',
      field: 'cabinetWidthMm',
      suggested: `${ctx.cabinet.suggestedCabinet.widthMm}×${ctx.cabinet.suggestedCabinet.heightMm} mm`,
      currentValue: `${input.cabinetWidthMm}×${input.cabinetHeightMm} mm`,
      reason: ctx.cabinet.suggestedCabinet.note,
      engineeringExplanation: 'Cabinets that divide the screen dimensions exactly eliminate edge strips and simplify structural steel.',
      suggestedAction: `Specify cabinets of ${ctx.cabinet.suggestedCabinet.widthMm}×${ctx.cabinet.suggestedCabinet.heightMm} mm.`,
      confidence: 0.8, priority: 'medium',
    })
  }

  // Sort by priority then confidence
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  out.sort((a, b) => order[a.priority] - order[b.priority] || b.confidence - a.confidence)
  return out
}

function rulePrettyTitle(id: string, field?: string): string {
  const map: Record<string, string> = {
    PITCH_TOO_COARSE_FOR_TEXT: 'Use finer pixel pitch for text content',
    BRIGHTNESS_TOO_LOW_OUTDOOR: 'Increase brightness for outdoor use',
    CORPORATE_NEEDS_FINE_PITCH: 'Corporate: prefer finer pitch',
    STADIUM_PITCH_TOO_FINE: 'Stadium: coarser pitch is sufficient',
    BRIGHTNESS_UNSPECIFIED: 'Specify brightness',
  }
  return map[id] ?? `Update ${field ?? 'value'}`
}

function sevToPriority(sev: 'info' | 'warning' | 'critical'): Recommendation['priority'] {
  if (sev === 'critical') return 'critical'
  if (sev === 'warning') return 'high'
  return 'medium'
}
