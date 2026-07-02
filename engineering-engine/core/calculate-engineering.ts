import type { ProjectData } from '../models/project-data'
import type { EngineeringResult, EngineeringMessage } from '../models/engineering-result'
import { validateProjectData } from '../validators/project-data-validator'
import { calculateAspectRatio } from '../calculators/aspect-ratio'
import { calculateScreenGeometry } from '../calculators/screen-geometry'
import { calculateResolution } from '../calculators/resolution'
import { calculatePixelDensity } from '../calculators/pixel-density'
import { calculateCabinetLayout } from '../calculators/cabinet'
import { calculatePower } from '../calculators/power'
import { calculateWeight } from '../calculators/weight'
import { calculateViewing } from '../calculators/viewing'
import { evaluateRules, findingsToMessages } from '../rules/rules-engine'
import { DEFAULT_RULES } from '../rules/default-rules'
import { generateRecommendations } from '../recommendations/recommendation-engine'
import { computeEngineeringScore } from '../scoring/engineering-score'

export const ENGINE_VERSION = '4B.0.0'

/**
 * Public entry point — Sprint 4B extended.
 * Includes: 4A modules + Cabinet + Power + Weight + Viewing + Rules +
 * Recommendations + Engineering Score. Additive to 4A shape.
 *
 * @pure (aside from `calculationTimeMs` and `generatedAt`)
 */
export function calculateEngineering(input: ProjectData): EngineeringResult {
  const start = perfNow()
  const { errors, warnings, info } = validateProjectData(input)

  if (errors.length > 0) {
    return {
      aspectRatio: EMPTY.aspect,
      geometry: EMPTY.geometry,
      resolution: EMPTY.resolution,
      pixelDensity: EMPTY.density,
      errors,
      warnings: [...warnings, ...info],
      notes: [],
      calculationTimeMs: safeElapsed(start),
      engineVersion: ENGINE_VERSION,
      generatedAt: new Date().toISOString(),
      ok: false,
    }
  }

  // 4A chain
  const geometry = calculateScreenGeometry(input.width, input.height, input.measurementUnit)
  const aspectRatio = calculateAspectRatio(geometry.widthMm, geometry.heightMm)
  const resolution = calculateResolution(geometry.widthMm, geometry.heightMm, input.pixelPitchMm)
  const pixelDensity = calculatePixelDensity(input.pixelPitchMm, resolution.horizontalPixels, resolution.verticalPixels)

  // 4B modules (all optional — only computed when inputs present)
  const cabinet = input.cabinetWidthMm && input.cabinetHeightMm
    ? calculateCabinetLayout(geometry.widthMm, geometry.heightMm, input.cabinetWidthMm, input.cabinetHeightMm)
    : undefined
  const power = calculatePower({
    screenAreaSqM: geometry.areaSqM,
    totalCabinets: cabinet?.totalCabinets,
    displayFamily: input.displayFamily,
    contentType: input.contentType,
    operationHoursPerDay: input.operationHoursPerDay,
  })
  const weight = calculateWeight({
    screenAreaSqM: geometry.areaSqM,
    totalCabinets: cabinet?.totalCabinets,
    displayFamily: input.displayFamily,
  })
  const viewing = calculateViewing(input.pixelPitchMm, input.viewingDistanceM)

  // Assemble a partial context for the rules engine.
  const preRules: EngineeringResult = {
    aspectRatio, geometry, resolution, pixelDensity,
    cabinet, power, weight, viewing,
    errors: [], warnings: [...warnings, ...info], notes: [],
    calculationTimeMs: 0, engineVersion: ENGINE_VERSION, generatedAt: '', ok: true,
    recommendations: [], score: undefined as unknown as EngineeringResult['score'],
  }

  const findings = evaluateRules(input, preRules, DEFAULT_RULES)
  const recommendations = generateRecommendations(input, preRules, findings)
  const score = computeEngineeringScore(input, preRules, findings)

  // Merge rule findings into warnings and split critical into errors.
  const ruleMessages: EngineeringMessage[] = findingsToMessages(findings)
  const criticalErrors = ruleMessages.filter((m) => m.code && findings.find((f) => f.ruleId === m.code && f.severity === 'critical'))
  const nonCritical = ruleMessages.filter((m) => !criticalErrors.includes(m))

  const notes: string[] = []
  if (!aspectRatio.isStandard) notes.push(`Non-standard aspect ratio (${aspectRatio.humanReadable}).`)
  if (resolution.class === 'Custom') notes.push('Resolution does not match a broadcast standard.')
  if (cabinet && !cabinet.isEfficient) notes.push(`Cabinet efficiency ${cabinet.efficiencyPercent}% — layout wastes ${cabinet.unusedAreaSqM} m².`)

  return {
    aspectRatio, geometry, resolution, pixelDensity,
    cabinet, power, weight, viewing,
    recommendations, score,
    errors: criticalErrors,
    warnings: [...warnings, ...info, ...nonCritical],
    notes,
    calculationTimeMs: safeElapsed(start),
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    ok: criticalErrors.length === 0,
  }
}

function perfNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
function safeElapsed(s: number): number {
  const e = perfNow() - s
  return Math.round(e * 1000) / 1000
}

const EMPTY = {
  aspect: { actualRatio: 0, closestStandard: '', closestStandardRatio: 0, toleranceFraction: 0, isStandard: false, reducedName: '', humanReadable: '', explanation: '' } as const,
  geometry: { widthMm: 0, heightMm: 0, diagonalMm: 0, diagonalInch: 0, areaSqM: 0, perimeterMm: 0, orientationDetected: 'landscape' as const },
  resolution: { horizontalPixels: 0, verticalPixels: 0, totalPixels: 0, megapixels: 0, class: 'Unknown', shortName: 'Unknown', nominal: null, explanation: '' } as const,
  density: { pixelsPerMeter: 0, pixelsPerSquareMeter: 0, pixelDensityPPI: 0, totalLEDs: 0 } as const,
}
