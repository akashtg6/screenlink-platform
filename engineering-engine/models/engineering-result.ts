// Extended engineering result types (Sprint 4B additive)
import type { CabinetLayout } from '../calculators/cabinet'
import type { PowerResult } from '../calculators/power'
import type { WeightResult } from '../calculators/weight'
import type { ViewingResult } from '../calculators/viewing'
import type { Recommendation } from '../recommendations/recommendation-engine'
import type { EngineeringScore } from '../scoring/engineering-score'

export type Severity = 'error' | 'warning' | 'info'

export interface EngineeringMessage {
  readonly code: string
  readonly field?: string
  readonly severity: Severity
  readonly message: string
  readonly suggestion?: string
}

export interface AspectRatioResult {
  readonly actualRatio: number; readonly closestStandard: string; readonly closestStandardRatio: number
  readonly toleranceFraction: number; readonly isStandard: boolean; readonly reducedName: string
  readonly humanReadable: string; readonly explanation: string
}
export interface ScreenGeometryResult {
  readonly widthMm: number; readonly heightMm: number; readonly diagonalMm: number
  readonly diagonalInch: number; readonly areaSqM: number; readonly perimeterMm: number
  readonly orientationDetected: 'landscape' | 'portrait' | 'square'
}
export interface ResolutionResult {
  readonly horizontalPixels: number; readonly verticalPixels: number; readonly totalPixels: number
  readonly megapixels: number; readonly class: string; readonly shortName: string
  readonly nominal: { width: number; height: number } | null; readonly explanation: string
}
export interface PixelDensityResult {
  readonly pixelsPerMeter: number; readonly pixelsPerSquareMeter: number
  readonly pixelDensityPPI: number; readonly totalLEDs: number
}

export interface EngineeringResult {
  readonly aspectRatio: AspectRatioResult
  readonly geometry: ScreenGeometryResult
  readonly resolution: ResolutionResult
  readonly pixelDensity: PixelDensityResult

  // Sprint 4B additive fields — all optional to remain backward-compatible.
  readonly cabinet?: CabinetLayout
  readonly power?: PowerResult
  readonly weight?: WeightResult
  readonly viewing?: ViewingResult
  readonly recommendations?: Recommendation[]
  readonly score?: EngineeringScore

  readonly warnings: readonly EngineeringMessage[]
  readonly errors: readonly EngineeringMessage[]
  readonly notes: readonly string[]

  readonly calculationTimeMs: number
  readonly engineVersion: string
  readonly generatedAt: string
  readonly ok: boolean
}
