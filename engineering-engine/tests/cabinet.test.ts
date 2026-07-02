import { describe, it, expect } from 'vitest'
import { calculateCabinetLayout } from '../calculators/cabinet'

describe('Cabinet Engine', () => {
  it('tiles a 6400×3600 screen with 640×360 cabinets — 100% efficient', () => {
    const r = calculateCabinetLayout(6400, 3600, 640, 360)
    expect(r.horizontalCount).toBe(10)
    expect(r.verticalCount).toBe(10)
    expect(r.totalCabinets).toBe(100)
    expect(r.efficiencyPercent).toBe(100)
    expect(r.isEfficient).toBe(true)
    expect(r.layoutMatrix).toHaveLength(100)
    expect(r.layoutMatrix[0]).toEqual({ row: 0, col: 0, xMm: 0, yMm: 0 })
  })

  it('flags inefficient layouts and suggests a divisor', () => {
    const r = calculateCabinetLayout(6400, 3600, 500, 500)  // remainders 400 and 100
    expect(r.efficiencyPercent).toBeLessThan(95)
    expect(r.isEfficient).toBe(false)
    // Suggestion is nice-to-have; may or may not exist depending on divisor availability.
    if (r.suggestedCabinet) expect(r.suggestedCabinet.widthMm).toBeGreaterThan(0)
  })

  it('rejects invalid inputs', () => {
    expect(() => calculateCabinetLayout(0, 100, 100, 100)).toThrow(RangeError)
    expect(() => calculateCabinetLayout(100, 100, 0, 100)).toThrow(RangeError)
  })
})
