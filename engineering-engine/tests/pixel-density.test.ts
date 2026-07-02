import { describe, it, expect } from 'vitest'
import { calculatePixelDensity } from '../calculators/pixel-density'

describe('calculatePixelDensity', () => {
  it('computes density for P1.0', () => {
    const d = calculatePixelDensity(1.0, 3840, 2160)
    expect(d.pixelsPerMeter).toBe(1000)
    expect(d.pixelsPerSquareMeter).toBe(1_000_000)
    expect(d.pixelDensityPPI).toBeCloseTo(25.4, 2)
    expect(d.totalLEDs).toBe(3840 * 2160)
  })

  it('computes density for P2.0', () => {
    const d = calculatePixelDensity(2.0, 100, 100)
    expect(d.pixelsPerMeter).toBe(500)
    expect(d.pixelsPerSquareMeter).toBe(250_000)
  })

  it('computes density for fine pitch P0.7', () => {
    const d = calculatePixelDensity(0.7, 1, 1)
    expect(d.pixelsPerMeter).toBeCloseTo(1428.571, 2)
    expect(d.pixelDensityPPI).toBeCloseTo(36.286, 2)
  })

  it('rejects invalid pitch', () => {
    expect(() => calculatePixelDensity(0, 100, 100)).toThrow(RangeError)
    expect(() => calculatePixelDensity(-1, 100, 100)).toThrow(RangeError)
  })

  it('rejects negative pixel counts', () => {
    expect(() => calculatePixelDensity(1, -100, 100)).toThrow(RangeError)
  })

  it('accepts zero pixels (empty screen)', () => {
    const d = calculatePixelDensity(1, 0, 0)
    expect(d.totalLEDs).toBe(0)
  })
})
