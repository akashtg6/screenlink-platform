import { VIEWING_DEFAULTS } from '../constants/engineering-defaults'
import { round } from '../utils/math'

export interface ViewingResult {
  minDistanceM: number
  recommendedDistanceM: number
  maxDistanceM: number
  actualDistanceM?: number
  comfortScore: number       // 0-100
  fitness: 'too_close' | 'ok' | 'ideal' | 'too_far' | 'unspecified'
  explanation: string
}

/**
 * MODULE 4 (4B) — Viewing Engine.
 * Applies the classic pixel-pitch viewing distance rule:
 *   min       = pitch(mm) × 1  (metres)
 *   recommended = pitch(mm) × 3
 *   max       = pitch(mm) × 30
 * Produces a 0-100 comfort score based on how close the actual viewing
 * distance is to the recommended value.
 *
 * @pure
 */
export function calculateViewing(pixelPitchMm: number, actualDistanceM?: number): ViewingResult {
  if (!Number.isFinite(pixelPitchMm) || pixelPitchMm <= 0)
    throw new RangeError('calculateViewing: pixelPitchMm must be > 0')

  const min = pixelPitchMm * VIEWING_DEFAULTS.minFactor
  const rec = pixelPitchMm * VIEWING_DEFAULTS.recommendedFactor
  const max = pixelPitchMm * VIEWING_DEFAULTS.maxFactor

  let comfortScore = 100
  let fitness: ViewingResult['fitness'] = 'unspecified'
  let explanation = `Recommended viewing distance for P${pixelPitchMm} is ~${round(rec, 2)} m (range ${round(min, 2)}–${round(max, 2)} m).`

  if (actualDistanceM !== undefined && Number.isFinite(actualDistanceM)) {
    if (actualDistanceM < min) {
      fitness = 'too_close'
      const ratio = actualDistanceM / min
      comfortScore = Math.max(0, Math.round(ratio * 60))
      explanation = `Actual distance ${actualDistanceM} m is below the minimum of ${round(min, 2)} m — pixels will be visible to viewers.`
    } else if (actualDistanceM > max) {
      fitness = 'too_far'
      const excess = actualDistanceM / max
      comfortScore = Math.max(0, Math.round(100 - (excess - 1) * 40))
      explanation = `Actual distance ${actualDistanceM} m exceeds the maximum useful distance of ${round(max, 2)} m — content will feel small.`
    } else if (Math.abs(actualDistanceM - rec) <= rec * 0.20) {
      fitness = 'ideal'
      comfortScore = 100
      explanation = `Actual distance ${actualDistanceM} m is within 20% of the recommended ${round(rec, 2)} m — ideal viewing.`
    } else {
      fitness = 'ok'
      const dist = Math.abs(actualDistanceM - rec) / rec
      comfortScore = Math.max(60, Math.round(100 - dist * 40))
      explanation = `Actual distance ${actualDistanceM} m is acceptable but not ideal (recommended ${round(rec, 2)} m).`
    }
  }

  return {
    minDistanceM: round(min, 2),
    recommendedDistanceM: round(rec, 2),
    maxDistanceM: round(max, 2),
    actualDistanceM,
    comfortScore,
    fitness,
    explanation,
  }
}
