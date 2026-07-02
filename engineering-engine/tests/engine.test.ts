import { describe, it, expect } from 'vitest'
import { calculateEngineering, ENGINE_VERSION } from '../core/calculate-engineering'
import type { ProjectData } from '../models/project-data'

describe('calculateEngineering — integration', () => {
  const goodInput: ProjectData = {
    projectName: 'Test wall',
    width: 6400, height: 3600, measurementUnit: 'mm',
    pixelPitchMm: 1.9,
    viewingDistanceM: 4.5,
  }

  it('returns a fully-populated result for a valid input', () => {
    const r = calculateEngineering(goodInput)
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
    expect(r.engineVersion).toBe(ENGINE_VERSION)
    expect(r.aspectRatio.closestStandard).toBe('16:9')
    expect(r.geometry.orientationDetected).toBe('landscape')
    expect(r.resolution.horizontalPixels).toBeGreaterThan(0)
    expect(r.pixelDensity.pixelsPerMeter).toBeCloseTo(526.316, 2)
    expect(r.calculationTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns errors for missing fields without throwing', () => {
    const r = calculateEngineering({} as ProjectData)
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.aspectRatio.actualRatio).toBe(0) // empty defaults
  })

  it('warns when viewing distance violates the 3× pitch rule', () => {
    const r = calculateEngineering({ ...goodInput, viewingDistanceM: 0.5 })
    expect(r.warnings.some((w) => w.code === 'VIEWING_DISTANCE_BELOW_PITCH_RULE')).toBe(true)
  })

  it('produces an engineering note for non-standard aspect', () => {
    const r = calculateEngineering({ ...goodInput, width: 1000, height: 522 })
    expect(r.notes.join(' ')).toMatch(/non-standard aspect/i)
  })

  it('produces an engineering note for Custom resolution', () => {
    const r = calculateEngineering({ ...goodInput, width: 1234, height: 567, pixelPitchMm: 1 })
    expect(r.notes.join(' ')).toMatch(/custom|non-standard/i)
  })

  it('is deterministic (same input → same numeric output)', () => {
    const a = calculateEngineering(goodInput)
    const b = calculateEngineering(goodInput)
    // Compare only the deterministic fields (calc time and timestamp differ).
    expect(a.aspectRatio).toEqual(b.aspectRatio)
    expect(a.geometry).toEqual(b.geometry)
    expect(a.resolution).toEqual(b.resolution)
    expect(a.pixelDensity).toEqual(b.pixelDensity)
    expect(a.errors).toEqual(b.errors)
  })
})
