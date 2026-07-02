import { describe, it, expect } from 'vitest'
import { calculatePower } from '../calculators/power'
import { calculateWeight } from '../calculators/weight'
import { calculateViewing } from '../calculators/viewing'

describe('Power Engine', () => {
  it('computes power for a 23 m² LED wall with 10h/day operation', () => {
    const r = calculatePower({ screenAreaSqM: 23.04, operationHoursPerDay: 10, displayFamily: 'led', contentType: 'video' })
    expect(r.maxWatts).toBeCloseTo(23.04 * 800, 1)
    expect(r.typicalWatts).toBeCloseTo(23.04 * 800 * 0.5, 1)
    expect(r.dailyKWh).toBeGreaterThan(0)
    expect(r.annualKWh).toBeCloseTo(r.dailyKWh * 365, 0)
  })
  it('reports per-cabinet power when total cabinets provided', () => {
    const r = calculatePower({ screenAreaSqM: 10, totalCabinets: 20 })
    expect(r.powerPerCabinetMaxW).toBeCloseTo((10 * 800) / 20, 1)
  })
  it('respects clamp on operation hours', () => {
    const r = calculatePower({ screenAreaSqM: 1, operationHoursPerDay: 30 })
    expect(r.operationHoursPerDay).toBe(24)
  })
})

describe('Weight Engine', () => {
  it('computes weight for LED family', () => {
    const r = calculateWeight({ screenAreaSqM: 23.04, displayFamily: 'led' })
    expect(r.totalDisplayWeightKg).toBeCloseTo(23.04 * 30, 1)
    expect(r.weightPerSqMKg).toBe(30)
  })
  it('supports LCD family', () => {
    const r = calculateWeight({ screenAreaSqM: 5, displayFamily: 'lcd' })
    expect(r.weightPerSqMKg).toBe(20)
  })
})

describe('Viewing Engine', () => {
  it('computes distance rules for P1.9', () => {
    const r = calculateViewing(1.9)
    expect(r.minDistanceM).toBeCloseTo(1.9, 2)
    expect(r.recommendedDistanceM).toBeCloseTo(5.7, 2)
    expect(r.maxDistanceM).toBeCloseTo(57, 1)
    expect(r.fitness).toBe('unspecified')
  })
  it('flags too_close when actual distance below min', () => {
    const r = calculateViewing(1.9, 1)
    expect(r.fitness).toBe('too_close')
    expect(r.comfortScore).toBeLessThan(100)
  })
  it('flags too_far when actual distance above max', () => {
    const r = calculateViewing(1.9, 100)
    expect(r.fitness).toBe('too_far')
  })
  it('rates ideal within ±20% of recommended', () => {
    const r = calculateViewing(1.9, 5.7)
    expect(r.fitness).toBe('ideal')
    expect(r.comfortScore).toBe(100)
  })
  it('rejects invalid pitch', () => {
    expect(() => calculateViewing(0)).toThrow(RangeError)
  })
})
