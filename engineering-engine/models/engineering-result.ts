export type Severity = 'error' | 'warning' | 'info'

export interface EngineeringMessage {
  readonly code: string       // e.g. 'INVALID_PIXEL_PITCH'
  readonly field?: string     // e.g. 'pixelPitchMm'
  readonly severity: Severity
  readonly message: string
  readonly suggestion?: string
}

export interface AspectRatioResult {
  readonly actualRatio: number             // width / height
  readonly closestStandard: string         // '16:9'
  readonly closestStandardRatio: number    // 1.7777...
  readonly toleranceFraction: number       // 0.02 = within 2 %
  readonly isStandard: boolean             // true if within default tolerance
  readonly reducedName: string             // e.g. '16:9' from actual GCD reduction
  readonly humanReadable: string           // e.g. '16:9 (1.78:1)'
  readonly explanation: string
}

export interface ScreenGeometryResult {
  readonly widthMm: number
  readonly heightMm: number
  readonly diagonalMm: number
  readonly diagonalInch: number
  readonly areaSqM: number
  readonly perimeterMm: number
  readonly orientationDetected: 'landscape' | 'portrait' | 'square'
}

export interface ResolutionResult {
  readonly horizontalPixels: number
  readonly verticalPixels: number
  readonly totalPixels: number
  readonly megapixels: number
  readonly class: string                   // 'Full HD', 'UHD 4K', 'Custom', ...
  readonly shortName: string               // 'FHD', '4K', 'Custom'
  readonly nominal: { width: number; height: number } | null
  readonly explanation: string
}

export interface PixelDensityResult {
  readonly pixelsPerMeter: number
  readonly pixelsPerSquareMeter: number
  readonly pixelDensityPPI: number         // pixels per inch (from pitch)
  readonly totalLEDs: number
}

export interface EngineeringResult {
  readonly aspectRatio: AspectRatioResult
  readonly geometry: ScreenGeometryResult
  readonly resolution: ResolutionResult
  readonly pixelDensity: PixelDensityResult

  readonly warnings: readonly EngineeringMessage[]
  readonly errors: readonly EngineeringMessage[]
  readonly notes: readonly string[]

  readonly calculationTimeMs: number
  readonly engineVersion: string
  readonly generatedAt: string             // ISO timestamp
  readonly ok: boolean                     // true when errors.length === 0
}
