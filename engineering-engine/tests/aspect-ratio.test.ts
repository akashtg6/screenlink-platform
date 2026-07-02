import { describe, it, expect } from 'vitest'
import { calculateAspectRatio } from '../calculators/aspect-ratio'

describe('calculateAspectRatio', () => {
  it('recognises 16:9 (Full HD)', () => {
    const r = calculateAspectRatio(1920, 1080)
    expect(r.closestStandard).toBe('16:9')
    expect(r.isStandard).toBe(true)
    expect(r.actualRatio).toBeCloseTo(1.7778, 3)
    expect(r.reducedName).toBe('16:9')
    expect(r.humanReadable).toContain('16:9')
  })

  it('recognises 21:9 (UltraWide)', () => {
    const r = calculateAspectRatio(3440, 1440)
    expect(r.closestStandard).toBe('21:9')
    expect(r.isStandard).toBe(true)
    expect(r.actualRatio).toBeCloseTo(2.389, 2)
  })

  it('recognises 32:9 (Super UltraWide)', () => {
    const r = calculateAspectRatio(3840, 1080)
    expect(r.closestStandard).toBe('32:9')
    expect(r.isStandard).toBe(true)
  })

  it('recognises 4:3', () => {
    const r = calculateAspectRatio(1024, 768)
    expect(r.closestStandard).toBe('4:3')
    expect(r.isStandard).toBe(true)
  })

  it('recognises 16:10', () => {
    const r = calculateAspectRatio(1920, 1200)
    expect(r.closestStandard).toBe('16:10')
    expect(r.isStandard).toBe(true)
  })

  it('recognises 1:1 (Square)', () => {
    const r = calculateAspectRatio(1080, 1080)
    expect(r.closestStandard).toBe('1:1')
    expect(r.isStandard).toBe(true)
    expect(r.actualRatio).toBe(1)
  })

  it('classifies non-standard as Custom', () => {
    const r = calculateAspectRatio(1000, 522)  // ~1.917:1, no exact standard
    expect(r.isStandard).toBe(false)
    expect(r.humanReadable).toContain('Custom')
  })

  it('rejects zero or negative width', () => {
    expect(() => calculateAspectRatio(0, 100)).toThrow(RangeError)
    expect(() => calculateAspectRatio(-100, 100)).toThrow(RangeError)
  })

  it('rejects zero or negative height', () => {
    expect(() => calculateAspectRatio(100, 0)).toThrow(RangeError)
    expect(() => calculateAspectRatio(100, -100)).toThrow(RangeError)
  })

  it('rejects non-finite values', () => {
    expect(() => calculateAspectRatio(NaN, 100)).toThrow(RangeError)
    expect(() => calculateAspectRatio(100, Infinity)).toThrow(RangeError)
  })

  it('accepts custom tolerance', () => {
    // 1.75 is 1.6% off 16:9 (1.777). With 0.01 tolerance it's Custom, with 0.03 it's 16:9.
    const strict = calculateAspectRatio(1750, 1000, 0.005)
    const lenient = calculateAspectRatio(1750, 1000, 0.03)
    expect(strict.isStandard).toBe(false)
    expect(lenient.isStandard).toBe(true)
  })

  it('is deterministic', () => {
    const a = calculateAspectRatio(3840, 2160)
    const b = calculateAspectRatio(3840, 2160)
    expect(a).toEqual(b)
  })
})
