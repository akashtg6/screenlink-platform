import { describe, it, expect } from 'vitest'
import { calculateScreenGeometry } from '../calculators/screen-geometry'

describe('calculateScreenGeometry', () => {
  it('computes geometry for a 6400×3600 mm LED wall', () => {
    const g = calculateScreenGeometry(6400, 3600, 'mm')
    expect(g.widthMm).toBe(6400)
    expect(g.heightMm).toBe(3600)
    expect(g.diagonalMm).toBeCloseTo(Math.hypot(6400, 3600), 1)
    expect(g.areaSqM).toBeCloseTo(23.04, 2)
    expect(g.perimeterMm).toBe(20000)
    expect(g.orientationDetected).toBe('landscape')
  })

  it('supports metres', () => {
    const g = calculateScreenGeometry(6.4, 3.6, 'm')
    expect(g.widthMm).toBe(6400)
    expect(g.heightMm).toBe(3600)
  })

  it('supports centimetres', () => {
    const g = calculateScreenGeometry(640, 360, 'cm')
    expect(g.widthMm).toBe(6400)
    expect(g.heightMm).toBe(3600)
  })

  it('supports inches', () => {
    const g = calculateScreenGeometry(100, 50, 'inch')
    expect(g.widthMm).toBeCloseTo(2540, 1)
    expect(g.heightMm).toBeCloseTo(1270, 1)
  })

  it('supports feet', () => {
    const g = calculateScreenGeometry(10, 5, 'ft')
    expect(g.widthMm).toBeCloseTo(3048, 1)
  })

  it('detects portrait orientation', () => {
    const g = calculateScreenGeometry(1080, 1920, 'mm')
    expect(g.orientationDetected).toBe('portrait')
  })

  it('detects square orientation', () => {
    const g = calculateScreenGeometry(2000, 2000, 'mm')
    expect(g.orientationDetected).toBe('square')
  })

  it('reports diagonal in inches (Pythagorean check)', () => {
    // 3-4-5 triangle: 3m x 4m = 5m diagonal = ~196.85"
    const g = calculateScreenGeometry(3, 4, 'm')
    expect(g.diagonalMm).toBeCloseTo(5000, 1)
    expect(g.diagonalInch).toBeCloseTo(5000 / 25.4, 2)
  })

  it('rejects invalid values', () => {
    expect(() => calculateScreenGeometry(0, 100, 'mm')).toThrow(RangeError)
    expect(() => calculateScreenGeometry(100, -1, 'mm')).toThrow(RangeError)
    expect(() => calculateScreenGeometry(NaN, 100, 'mm')).toThrow(RangeError)
  })
})
