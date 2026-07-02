import type { ProjectData } from '../models/project-data'
import type { EngineeringResult, EngineeringMessage } from '../models/engineering-result'
import { validateProjectData } from '../validators/project-data-validator'
import { calculateAspectRatio } from '../calculators/aspect-ratio'
import { calculateScreenGeometry } from '../calculators/screen-geometry'
import { calculateResolution } from '../calculators/resolution'
import { calculatePixelDensity } from '../calculators/pixel-density'

export const ENGINE_VERSION = '4A.0.0'

/**
 * Public entry point. UI code MUST call this and this only.
 *
 * Guarantees:
 *   • Never throws for validation failures — errors are returned in `errors`.
 *   • Deterministic: same input → same output (aside from `calculationTimeMs`
 *     and `generatedAt`).
 *   • Pure: no side effects, no network, no DB, no React, no globals.
 */
export function calculateEngineering(input: ProjectData): EngineeringResult {
  const start = perfNow()
  const { errors, warnings, info } = validateProjectData(input)

  const notes: string[] = []
  const warningsAll: EngineeringMessage[] = [...warnings, ...info]

  // Return early if input is fundamentally invalid.
  if (errors.length > 0) {
    return {
      aspectRatio: EMPTY_ASPECT,
      geometry: EMPTY_GEOMETRY,
      resolution: EMPTY_RESOLUTION,
      pixelDensity: EMPTY_DENSITY,
      errors,
      warnings: warningsAll,
      notes,
      calculationTimeMs: round(perfNow() - start, 3),
      engineVersion: ENGINE_VERSION,
      generatedAt: new Date().toISOString(),
      ok: false,
    }
  }

  // Deterministic calculation chain.
  const geometry = calculateScreenGeometry(input.width, input.height, input.measurementUnit)
  const aspectRatio = calculateAspectRatio(geometry.widthMm, geometry.heightMm)
  const resolution = calculateResolution(geometry.widthMm, geometry.heightMm, input.pixelPitchMm)
  const pixelDensity = calculatePixelDensity(
    input.pixelPitchMm,
    resolution.horizontalPixels,
    resolution.verticalPixels,
  )

  // Higher-level notes derived from combined results.
  if (!aspectRatio.isStandard) {
    notes.push(`Non-standard aspect ratio (${aspectRatio.humanReadable}). Content should be authored to the actual canvas.`)
  }
  if (resolution.class === 'Custom') {
    notes.push('Resolution does not match a broadcast standard — downstream media playback must scale content accordingly.')
  }
  if (input.viewingDistanceM && input.pixelPitchMm) {
    const rule10 = input.pixelPitchMm * 3   // classic “pitch × 3” = safe min distance (m)
    if (input.viewingDistanceM < rule10) {
      warningsAll.push({
        code: 'VIEWING_DISTANCE_BELOW_PITCH_RULE',
        field: 'viewingDistanceM',
        severity: 'warning',
        message: `Nearest viewing distance ${input.viewingDistanceM} m may be too close for a P${input.pixelPitchMm} display.`,
        suggestion: `Rule of thumb: minimum viewing distance (m) ≈ pixel pitch (mm) × 3 = ${rule10} m.`,
      })
    }
  }

  return {
    aspectRatio,
    geometry,
    resolution,
    pixelDensity,
    errors: [],
    warnings: warningsAll,
    notes,
    calculationTimeMs: round(perfNow() - start, 3),
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    ok: true,
  }
}

/* ------------------------------------------------------------------ */
// Small helpers kept private to the entry point.

function perfNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function round(n: number, d = 3): number {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

const EMPTY_ASPECT = {
  actualRatio: 0, closestStandard: '', closestStandardRatio: 0, toleranceFraction: 0,
  isStandard: false, reducedName: '', humanReadable: '', explanation: '',
} as const
const EMPTY_GEOMETRY = {
  widthMm: 0, heightMm: 0, diagonalMm: 0, diagonalInch: 0, areaSqM: 0,
  perimeterMm: 0, orientationDetected: 'landscape' as const,
}
const EMPTY_RESOLUTION = {
  horizontalPixels: 0, verticalPixels: 0, totalPixels: 0, megapixels: 0,
  class: 'Unknown', shortName: 'Unknown', nominal: null, explanation: '',
} as const
const EMPTY_DENSITY = {
  pixelsPerMeter: 0, pixelsPerSquareMeter: 0, pixelDensityPPI: 0, totalLEDs: 0,
} as const
