import type { AspectRatioResult } from '../models/engineering-result'
import { ASPECT_RATIO_TOLERANCE, STANDARD_ASPECT_RATIOS } from '../constants/aspect-ratios'
import { gcd, round } from '../utils/math'

/**
 * MODULE 1 — Aspect Ratio Calculator
 *
 * Given width and height in ANY consistent unit, returns:
 *   • actual ratio (float)
 *   • closest matching standard (16:9, 21:9, …)
 *   • tolerance fraction (|actual - standard| / standard)
 *   • GCD-reduced ratio name (e.g. 3840×2160 → '16:9')
 *   • humanReadable label + explanation
 *
 * @pure
 */
export function calculateAspectRatio(width: number, height: number, tolerance = ASPECT_RATIO_TOLERANCE): AspectRatioResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('calculateAspectRatio: width and height must be positive finite numbers')
  }

  const actualRatio = width / height

  // Find closest standard by absolute difference in ratio.
  let closest = STANDARD_ASPECT_RATIOS[0]
  let closestDiff = Math.abs(actualRatio - closest.ratio)
  for (const s of STANDARD_ASPECT_RATIOS) {
    const d = Math.abs(actualRatio - s.ratio)
    if (d < closestDiff) { closest = s; closestDiff = d }
  }
  const toleranceFraction = closestDiff / closest.ratio
  const isStandard = toleranceFraction <= tolerance

  // GCD reduction (works for integer-ish inputs; still meaningful for floats)
  const scale = 10_000
  const wScaled = Math.round(width * scale)
  const hScaled = Math.round(height * scale)
  const g = gcd(wScaled, hScaled)
  const reducedW = wScaled / g
  const reducedH = hScaled / g
  const reducedName = `${reducedW}:${reducedH}`

  const humanReadable = isStandard
    ? `${closest.name} (${round(actualRatio, 2)}:1)`
    : `Custom (${round(actualRatio, 2)}:1)`

  const explanation = isStandard
    ? `Actual ratio ${round(actualRatio, 4)} matches the standard ${closest.name} ratio ` +
      `(${round(closest.ratio, 4)}) within ${round(toleranceFraction * 100, 2)}% tolerance.` +
      (closest.nickname ? ` Commonly referred to as “${closest.nickname}”.` : '')
    : `Actual ratio ${round(actualRatio, 4)} deviates ${round(toleranceFraction * 100, 2)}% from the ` +
      `nearest standard (${closest.name} at ${round(closest.ratio, 4)}). Treated as a custom ratio.`

  return {
    actualRatio: round(actualRatio, 6),
    closestStandard: closest.name,
    closestStandardRatio: round(closest.ratio, 6),
    toleranceFraction: round(toleranceFraction, 6),
    isStandard,
    reducedName,
    humanReadable,
    explanation,
  }
}
