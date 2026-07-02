import { describe, it, expect } from 'vitest'
import { calculateResolution } from '../calculators/resolution'

describe('calculateResolution', () => {
  it('classifies Full HD from a P1.0 3.84m×2.16m panel', () => {
    // width 3840mm / 1.0 pitch = 3840 horiz — which is 4K, not FHD.
    // For FHD (1920): width 1920mm / 1.0 pitch → 1920.
    const r = calculateResolution(1920, 1080, 1.0)
    expect(r.horizontalPixels).toBe(1920)
    expect(r.verticalPixels).toBe(1080)
    expect(r.class).toBe('Full HD')
    expect(r.shortName).toBe('FHD')
    expect(r.totalPixels).toBe(2_073_600)
    expect(r.megapixels).toBeCloseTo(2.074, 3)
  })

  it('classifies UHD 4K', () => {
    const r = calculateResolution(3840, 2160, 1.0)
    expect(r.class).toBe('UHD 4K')
    expect(r.shortName).toBe('4K')
    expect(r.horizontalPixels).toBe(3840)
    expect(r.verticalPixels).toBe(2160)
  })

  it('classifies 8K', () => {
    const r = calculateResolution(7680, 4320, 1.0)
    expect(r.class).toBe('8K')
  })

  it('classifies HD', () => {
    const r = calculateResolution(1280, 720, 1.0)
    expect(r.class).toBe('HD')
  })

  it('marks non-standard sizes as Custom', () => {
    // 3000×1234 px is not close to any class
    const r = calculateResolution(3000, 1234, 1.0)
    expect(r.class).toBe('Custom')
  })

  it('scales pixel count with pixel pitch', () => {
    const p10 = calculateResolution(6400, 3600, 1.0)
    const p20 = calculateResolution(6400, 3600, 2.0)
    expect(p10.horizontalPixels).toBe(6400)
    expect(p20.horizontalPixels).toBe(3200)
    expect(p10.totalPixels).toBe(p20.totalPixels * 4)
  })

  it('floors pixel counts (partial pixels are impossible)', () => {
    const r = calculateResolution(1919.9, 1080, 1.0)
    expect(r.horizontalPixels).toBe(1919)
  })

  it('rejects invalid inputs', () => {
    expect(() => calculateResolution(0, 100, 1)).toThrow(RangeError)
    expect(() => calculateResolution(100, 0, 1)).toThrow(RangeError)
    expect(() => calculateResolution(100, 100, 0)).toThrow(RangeError)
    expect(() => calculateResolution(NaN, 100, 1)).toThrow(RangeError)
  })

  it('provides a human-readable explanation', () => {
    const r = calculateResolution(1920, 1080, 1.0)
    expect(r.explanation).toContain('Full HD')
    expect(r.explanation).toContain('1920')
  })
})
