import { round } from '../utils/math'

export interface CabinetLayout {
  horizontalCount: number
  verticalCount: number
  totalCabinets: number
  cabinetWidthMm: number
  cabinetHeightMm: number
  screenWidthMm: number
  screenHeightMm: number
  usedWidthMm: number
  usedHeightMm: number
  unusedWidthMm: number
  unusedHeightMm: number
  unusedAreaSqM: number
  screenAreaSqM: number
  usedAreaSqM: number
  efficiencyPercent: number
  isEfficient: boolean            // >= 95%
  layoutMatrix: { row: number; col: number; xMm: number; yMm: number }[]
  suggestedCabinet?: { widthMm: number; heightMm: number; note: string }
}

/**
 * MODULE 1 (4B) — Cabinet Engine.
 * Computes tiling of a screen by fixed-size cabinets and generates a layout
 * matrix. Flags inefficient layouts (< 95%) and suggests a divisor-based
 * cabinet size if a simple exact-fit exists.
 *
 * @pure
 */
export function calculateCabinetLayout(
  screenWidthMm: number, screenHeightMm: number,
  cabinetWidthMm: number, cabinetHeightMm: number,
): CabinetLayout {
  if (![screenWidthMm, screenHeightMm, cabinetWidthMm, cabinetHeightMm].every((n) => Number.isFinite(n) && n > 0))
    throw new RangeError('calculateCabinetLayout: all inputs must be positive finite numbers')

  const h = Math.floor(screenWidthMm / cabinetWidthMm)
  const v = Math.floor(screenHeightMm / cabinetHeightMm)
  const used_w = h * cabinetWidthMm
  const used_h = v * cabinetHeightMm
  const unused_w = screenWidthMm - used_w
  const unused_h = screenHeightMm - used_h
  const screenArea = screenWidthMm * screenHeightMm
  const usedArea = used_w * used_h
  const unusedArea = screenArea - usedArea
  const efficiency = screenArea > 0 ? (usedArea / screenArea) * 100 : 0

  const layoutMatrix: CabinetLayout['layoutMatrix'] = []
  for (let r = 0; r < v; r++) {
    for (let c = 0; c < h; c++) {
      layoutMatrix.push({ row: r, col: c, xMm: c * cabinetWidthMm, yMm: r * cabinetHeightMm })
    }
  }

  const isEfficient = efficiency >= 95
  let suggestedCabinet: CabinetLayout['suggestedCabinet'] | undefined
  if (!isEfficient) {
    // Suggest a cabinet size that divides both dimensions cleanly (common divisor near the original).
    const suggestedW = nearestDivisor(screenWidthMm, cabinetWidthMm)
    const suggestedH = nearestDivisor(screenHeightMm, cabinetHeightMm)
    if (suggestedW && suggestedH && (suggestedW !== cabinetWidthMm || suggestedH !== cabinetHeightMm)) {
      suggestedCabinet = {
        widthMm: suggestedW,
        heightMm: suggestedH,
        note: `Cabinet ${suggestedW}×${suggestedH} mm tiles ${screenWidthMm}×${screenHeightMm} mm exactly.`,
      }
    }
  }

  return {
    horizontalCount: h,
    verticalCount: v,
    totalCabinets: h * v,
    cabinetWidthMm,
    cabinetHeightMm,
    screenWidthMm,
    screenHeightMm,
    usedWidthMm: used_w,
    usedHeightMm: used_h,
    unusedWidthMm: round(unused_w, 2),
    unusedHeightMm: round(unused_h, 2),
    unusedAreaSqM: round(unusedArea / 1_000_000, 4),
    screenAreaSqM: round(screenArea / 1_000_000, 4),
    usedAreaSqM: round(usedArea / 1_000_000, 4),
    efficiencyPercent: round(efficiency, 2),
    isEfficient,
    layoutMatrix,
    suggestedCabinet,
  }
}

/** Find the divisor of `dim` closest to `preferred` (within ±20%). */
function nearestDivisor(dim: number, preferred: number): number | null {
  const lo = preferred * 0.8, hi = preferred * 1.2
  const rounded = Math.round(dim)
  let best: number | null = null; let bestDiff = Infinity
  for (let d = Math.max(50, Math.floor(lo)); d <= Math.ceil(hi); d++) {
    if (rounded % d === 0) {
      const diff = Math.abs(d - preferred)
      if (diff < bestDiff) { best = d; bestDiff = diff }
    }
  }
  return best
}
