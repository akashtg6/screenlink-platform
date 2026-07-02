import { describe, it, expect } from 'vitest'
import { calculateEngineering } from '../core/calculate-engineering'
import type { ProjectData } from '../models/project-data'

describe('Rules + Recommendation + Score — integration', () => {
  const base: ProjectData = {
    width: 6400, height: 3600, measurementUnit: 'mm', pixelPitchMm: 1.9,
    viewingDistanceM: 5.7,
    cabinetWidthMm: 640, cabinetHeightMm: 360,
    displayFamily: 'led', environment: 'indoor', operationHoursPerDay: 10, contentType: 'video',
    application: 'corporate',
  }

  it('produces cabinet, power, weight, viewing, recommendations, and score for a valid input', () => {
    const r = calculateEngineering(base)
    expect(r.ok).toBe(true)
    expect(r.cabinet?.efficiencyPercent).toBe(100)
    expect(r.power?.maxWatts).toBeGreaterThan(0)
    expect(r.weight?.totalDisplayWeightKg).toBeGreaterThan(0)
    expect(r.viewing?.fitness).toBe('ideal')
    expect(r.score?.overall).toBeGreaterThan(80)
    expect(r.score?.grade).toMatch(/[A-C]/)
    expect(Array.isArray(r.recommendations)).toBe(true)
  })

  it('flags PITCH_TOO_COARSE_FOR_TEXT for control_room + coarse pitch', () => {
    const r = calculateEngineering({ ...base, contentType: 'control_room', pixelPitchMm: 3.9 })
    const codes = [...r.warnings, ...r.errors].map((w) => w.code)
    expect(codes).toContain('PITCH_TOO_COARSE_FOR_TEXT')
    expect(r.recommendations?.some((rec) => rec.field === 'pixelPitchMm')).toBe(true)
  })

  it('flags BRIGHTNESS_TOO_LOW_OUTDOOR as a critical error', () => {
    const r = calculateEngineering({ ...base, environment: 'outdoor', brightnessNits: 800 })
    expect(r.errors.some((e) => e.code === 'BRIGHTNESS_TOO_LOW_OUTDOOR')).toBe(true)
    expect(r.ok).toBe(false)
  })

  it('flags CABINET_INEFFICIENT_LAYOUT when tiling wastes area', () => {
    const r = calculateEngineering({ ...base, cabinetWidthMm: 500, cabinetHeightMm: 500 })
    const codes = [...r.warnings, ...r.errors].map((w) => w.code)
    expect(codes).toContain('CABINET_INEFFICIENT_LAYOUT')
  })

  it('recommends portrait orientation for tall aspect', () => {
    const r = calculateEngineering({ ...base, width: 1080, height: 1920, cabinetWidthMm: undefined, cabinetHeightMm: undefined })
    expect(r.recommendations?.some((rec) => rec.suggested === 'portrait')).toBe(true)
  })

  it('is deterministic', () => {
    const a = calculateEngineering(base)
    const b = calculateEngineering(base)
    expect(a.score).toEqual(b.score)
    expect(a.cabinet).toEqual(b.cabinet)
  })

  it('runs a full calculation in < 10 ms', () => {
    for (let i = 0; i < 5; i++) calculateEngineering(base)  // warm-up
    const start = performance.now()
    calculateEngineering(base)
    expect(performance.now() - start).toBeLessThan(10)
  })

  it('sustains 1000 iterations in < 600 ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) calculateEngineering({ ...base, width: 6400 + i })
    const elapsed = performance.now() - start
    // eslint-disable-next-line no-console
    console.log(`  → 4B 1000 iterations: ${elapsed.toFixed(2)} ms`)
    expect(elapsed).toBeLessThan(600)
  })
})
