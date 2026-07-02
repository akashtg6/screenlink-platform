import type { PixelDensityResult } from '../models/engineering-result'
import { round } from '../utils/math'

/**
 * MODULE 4 — Pixel Density Calculator
 *
 * Formulae:
 *   pixels/meter        = 1000 / pitch_mm
 *   pixels/m²           = (1000 / pitch_mm)²
 *   PPI                 = 25.4 / pitch_mm  (industry standard: pixels per inch)
 *   totalLEDs           = horizontalPixels × verticalPixels
 *                         (for RGB LED modules where 1 LED module = 1 pixel;
 *                          sub-pixel LED count is a downstream cabinet-engine concern)
 *
 * @pure
 */
export function calculatePixelDensity(
  pixelPitchMm: number,
  horizontalPixels: number,
  verticalPixels: number,
): PixelDensityResult {
  if (!Number.isFinite(pixelPitchMm) || pixelPitchMm <= 0)
    throw new RangeError('calculatePixelDensity: pixelPitchMm must be > 0')
  if (!Number.isFinite(horizontalPixels) || horizontalPixels < 0)
    throw new RangeError('calculatePixelDensity: horizontalPixels must be >= 0')
  if (!Number.isFinite(verticalPixels) || verticalPixels < 0)
    throw new RangeError('calculatePixelDensity: verticalPixels must be >= 0')

  const pixelsPerMeter = 1000 / pixelPitchMm
  const pixelsPerSquareMeter = pixelsPerMeter * pixelsPerMeter
  const pixelDensityPPI = 25.4 / pixelPitchMm
  const totalLEDs = horizontalPixels * verticalPixels

  return {
    pixelsPerMeter: round(pixelsPerMeter, 3),
    pixelsPerSquareMeter: round(pixelsPerSquareMeter, 1),
    pixelDensityPPI: round(pixelDensityPPI, 3),
    totalLEDs,
  }
}
