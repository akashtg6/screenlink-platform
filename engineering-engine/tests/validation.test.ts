import { describe, it, expect } from 'vitest'
import { validateProjectData } from '../validators/project-data-validator'
import type { ProjectData } from '../models/project-data'

const baseValid: ProjectData = {
  width: 6400, height: 3600, measurementUnit: 'mm', pixelPitchMm: 1.9,
}

describe('validateProjectData', () => {
  it('accepts a valid project', () => {
    const r = validateProjectData(baseValid)
    expect(r.errors).toHaveLength(0)
  })

  it('rejects missing required fields', () => {
    const r = validateProjectData({} as ProjectData)
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true)
  })

  it('rejects zero width', () => {
    const r = validateProjectData({ ...baseValid, width: 0 })
    expect(r.errors.some((e) => e.code === 'INVALID_WIDTH')).toBe(true)
  })

  it('rejects negative height', () => {
    const r = validateProjectData({ ...baseValid, height: -100 })
    expect(r.errors.some((e) => e.code === 'INVALID_HEIGHT')).toBe(true)
  })

  it('rejects zero pixel pitch', () => {
    const r = validateProjectData({ ...baseValid, pixelPitchMm: 0 })
    expect(r.errors.some((e) => e.code === 'INVALID_PIXEL_PITCH')).toBe(true)
  })

  it('warns on very small width (< 100 mm)', () => {
    const r = validateProjectData({ ...baseValid, width: 50 })
    expect(r.warnings.some((w) => w.code === 'WIDTH_TOO_SMALL')).toBe(true)
  })

  it('warns on huge dimensions (> 200 m)', () => {
    const r = validateProjectData({ ...baseValid, width: 250, measurementUnit: 'm' })
    expect(r.warnings.some((w) => w.code === 'WIDTH_TOO_LARGE')).toBe(true)
  })

  it('warns on ultra-fine pixel pitch (< 0.3 mm)', () => {
    const r = validateProjectData({ ...baseValid, pixelPitchMm: 0.2 })
    expect(r.warnings.some((w) => w.code === 'PIXEL_PITCH_TOO_FINE')).toBe(true)
  })

  it('warns on coarse pixel pitch (> 40 mm)', () => {
    const r = validateProjectData({ ...baseValid, pixelPitchMm: 50 })
    expect(r.warnings.some((w) => w.code === 'PIXEL_PITCH_TOO_COARSE')).toBe(true)
  })

  it('warns on invalid operation hours', () => {
    const r = validateProjectData({ ...baseValid, operationHoursPerDay: 30 })
    expect(r.warnings.some((w) => w.code === 'INVALID_OPERATION_HOURS')).toBe(true)
  })

  it('emits info when cabinet does not tile', () => {
    // 6400 mm % 500 mm = 400 mm remainder (does not tile).
    const r = validateProjectData({ ...baseValid, cabinetWidthMm: 500, cabinetHeightMm: 500 })
    expect(r.info.some((i) => i.code === 'CABINET_DOES_NOT_TILE')).toBe(true)
  })

  it('does not emit info when cabinet tiles cleanly', () => {
    const r = validateProjectData({ ...baseValid, cabinetWidthMm: 640, cabinetHeightMm: 360 })
    expect(r.info.filter((i) => i.code === 'CABINET_DOES_NOT_TILE')).toHaveLength(0)
  })
})
