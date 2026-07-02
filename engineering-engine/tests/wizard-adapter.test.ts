import { describe, it, expect } from 'vitest'
import { wizardValuesToProjectData, parseCabinetSize } from '@/lib/engineering/wizard-to-engine'
import type { ProjectWizardValues } from '@/lib/validation/project-schemas'
import { WIZARD_DEFAULTS } from '@/lib/validation/project-schemas'

const base: ProjectWizardValues = {
  ...WIZARD_DEFAULTS,
  name: 'Test',
  customerName: 'ACME',
  installationTypes: ['indoor', 'led'],
  screenWidth: 6400,
  screenHeight: 3600,
  measurementUnit: 'mm',
  pixelPitchPreference: 1.9,
  cabinetSize: '640×360 mm',
  nearestDistanceM: 2,
  farthestDistanceM: 5.7,
  contentType: 'video',
  ambientLight: 'medium',
  operationHoursPerDay: 10,
  application: 'corporate',
  orientation: 'landscape',
}

describe('wizardValuesToProjectData adapter', () => {
  it('returns null when required engine fields are missing', () => {
    expect(wizardValuesToProjectData(null)).toBeNull()
    expect(wizardValuesToProjectData({})).toBeNull()
    expect(wizardValuesToProjectData({ ...WIZARD_DEFAULTS, screenWidth: 6400 } as ProjectWizardValues)).toBeNull()
  })

  it('maps a filled wizard to a valid engine ProjectData', () => {
    const pd = wizardValuesToProjectData(base)
    expect(pd).not.toBeNull()
    expect(pd!.width).toBe(6400)
    expect(pd!.height).toBe(3600)
    expect(pd!.measurementUnit).toBe('mm')
    expect(pd!.pixelPitchMm).toBe(1.9)
    expect(pd!.cabinetWidthMm).toBe(640)
    expect(pd!.cabinetHeightMm).toBe(360)
    expect(pd!.viewingDistanceM).toBe(5.7)
    expect(pd!.contentType).toBe('video')
    expect(pd!.operationHoursPerDay).toBe(10)
    expect(pd!.environment).toBe('indoor')
    expect(pd!.displayFamily).toBe('led')
    expect(pd!.orientation).toBe('landscape')
  })

  it('derives outdoor environment', () => {
    const pd = wizardValuesToProjectData({ ...base, installationTypes: ['outdoor', 'led'] })
    expect(pd!.environment).toBe('outdoor')
  })

  it('derives semi_outdoor if directSunlight and no explicit outdoor', () => {
    const pd = wizardValuesToProjectData({ ...base, installationTypes: ['indoor'], directSunlight: true })
    expect(pd!.environment).toBe('semi_outdoor')
  })

  it('derives lcd family from lcd_video_wall type', () => {
    const pd = wizardValuesToProjectData({ ...base, installationTypes: ['lcd_video_wall'] })
    expect(pd!.displayFamily).toBe('lcd')
  })
})

describe('parseCabinetSize', () => {
  it('parses common formats', () => {
    expect(parseCabinetSize('500x500 mm')).toEqual({ widthMm: 500, heightMm: 500 })
    expect(parseCabinetSize('640×360')).toEqual({ widthMm: 640, heightMm: 360 })
    expect(parseCabinetSize('500 X 500')).toEqual({ widthMm: 500, heightMm: 500 })
    expect(parseCabinetSize('600×337.5')).toEqual({ widthMm: 600, heightMm: 337.5 })
  })
  it('rejects malformed strings', () => {
    expect(parseCabinetSize('')).toBeUndefined()
    expect(parseCabinetSize('unknown')).toBeUndefined()
    expect(parseCabinetSize('500')).toBeUndefined()
    expect(parseCabinetSize(undefined)).toBeUndefined()
  })
})
