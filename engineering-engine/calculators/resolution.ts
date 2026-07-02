import type { ResolutionResult } from '../models/engineering-result'
import { RESOLUTION_CLASSES, RESOLUTION_TOLERANCE } from '../constants/resolutions'
import { round } from '../utils/math'

/**
 * MODULE 3 — Resolution Calculator
 *
 * Given screen width & height in millimetres and pixel pitch (mm), compute
 * pixel counts and classify against standard resolution classes.
 *
 * Pixel count formula:  pixels = length_mm / pitch_mm
 *
 * @pure
 */
export function calculateResolution(widthMm: number, heightMm: number, pixelPitchMm: number): ResolutionResult {
  if (!Number.isFinite(widthMm) || widthMm <= 0)
    throw new RangeError('calculateResolution: widthMm must be > 0')
  if (!Number.isFinite(heightMm) || heightMm <= 0)
    throw new RangeError('calculateResolution: heightMm must be > 0')
  if (!Number.isFinite(pixelPitchMm) || pixelPitchMm <= 0)
    throw new RangeError('calculateResolution: pixelPitchMm must be > 0')

  const horizontalPixels = Math.floor(widthMm / pixelPitchMm)
  const verticalPixels = Math.floor(heightMm / pixelPitchMm)
  const totalPixels = horizontalPixels * verticalPixels
  const megapixels = totalPixels / 1_000_000

  // Classification: match by both horizontal and vertical to closest class within tolerance.
  let best: (typeof RESOLUTION_CLASSES)[number] | null = null
  let bestScore = Infinity
  for (const c of RESOLUTION_CLASSES) {
    const dh = Math.abs(horizontalPixels - c.nominalWidth) / c.nominalWidth
    const dv = Math.abs(verticalPixels - c.nominalHeight) / c.nominalHeight
    // score = worse of the two dimensions
    const score = Math.max(dh, dv)
    if (score < bestScore) { best = c; bestScore = score }
  }

  const classified = best && bestScore <= RESOLUTION_TOLERANCE

  const className = classified ? best!.name : 'Custom'
  const shortName = classified ? best!.shortName : 'Custom'
  const nominal = classified ? { width: best!.nominalWidth, height: best!.nominalHeight } : null

  const explanation = classified
    ? `Computed ${horizontalPixels}×${verticalPixels} px matches the ${best!.name} class ` +
      `(nominal ${best!.nominalWidth}×${best!.nominalHeight}, tolerance ${round(bestScore * 100, 2)}%).`
    : `Computed ${horizontalPixels}×${verticalPixels} px does not fall within ±${RESOLUTION_TOLERANCE * 100}% of any ` +
      `standard class — treated as a Custom resolution (closest match: ${best?.name ?? 'n/a'} at ${round(bestScore * 100, 2)}%).`

  return {
    horizontalPixels,
    verticalPixels,
    totalPixels,
    megapixels: round(megapixels, 3),
    class: className,
    shortName,
    nominal,
    explanation,
  }
}
