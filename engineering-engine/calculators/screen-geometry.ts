import type { ScreenGeometryResult } from '../models/engineering-result'
import type { MeasurementUnit } from '../constants/units'
import { mmToInch, round, toMm } from '../utils/math'

/**
 * MODULE 2 — Screen Geometry Calculator
 *
 * Normalises input dimensions to millimetres and returns physical geometry
 * (diagonal, area, perimeter) plus a detected orientation.
 *
 * @pure
 */
export function calculateScreenGeometry(width: number, height: number, unit: MeasurementUnit): ScreenGeometryResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('calculateScreenGeometry: width and height must be positive finite numbers')
  }

  const widthMm = toMm(width, unit)
  const heightMm = toMm(height, unit)
  const diagonalMm = Math.hypot(widthMm, heightMm)
  const areaSqM = (widthMm * heightMm) / 1_000_000  // mm² → m²
  const perimeterMm = 2 * (widthMm + heightMm)

  const orientationDetected: ScreenGeometryResult['orientationDetected'] =
    widthMm > heightMm ? 'landscape' : widthMm < heightMm ? 'portrait' : 'square'

  return {
    widthMm: round(widthMm, 2),
    heightMm: round(heightMm, 2),
    diagonalMm: round(diagonalMm, 2),
    diagonalInch: round(mmToInch(diagonalMm), 2),
    areaSqM: round(areaSqM, 4),
    perimeterMm: round(perimeterMm, 2),
    orientationDetected,
  }
}
