import { describe, it, expect } from 'vitest'
import { calculateEngineering } from '@/engineering-engine'
import { calculateCommercial, type CommercialInput } from '@/commercial-engine'
import { generateBOQ } from '@/boq-engine'
import { generateReport, mergeBranding, REPORT_KINDS } from '@/proposal-engine'

const engineering = calculateEngineering({
  projectName: 'X', width: 6400, height: 3600, measurementUnit: 'mm',
  pixelPitchMm: 1.9, cabinetWidthMm: 640, cabinetHeightMm: 360,
  viewingDistanceM: 5.7, environment: 'indoor', contentType: 'video',
})
const commInput: CommercialInput = {
  currency: 'INR',
  ledCostPerSqM: 90000, cabinetCostPerUnit: 45000, controllerCost: 65000,
  controllerQuantity: 5, receivingCardCostPerUnit: 3500, powerSupplyCostPerUnit: 6500,
  cablesCost: 15000, accessoriesCost: 8000,
  steelStructureCost: 40000, transportationCost: 25000,
  installationCost: 55000, commissioningCost: 20000,
  marginPercent: 25, warrantyYears: 2, warrantyCostPercent: 3,
  amcYears: 3, amcCostPercentPerYear: 5,
  tax: { label: 'GST', ratePercent: 18 },
}
const commercial = calculateCommercial(commInput, engineering)
const boq = generateBOQ({ engineering, commercial })
const inputs = {
  branding: mergeBranding(),
  customer: { name: 'ACME', organization: 'ACME Corp' },
  project: { projectName: 'Test project', proposalNumber: 'X-0001', revision: 'R0' },
  engineering, commercial, boq,
}

describe('Report presets', () => {
  it('lists the 5 supported kinds', () => {
    expect(REPORT_KINDS.map(k => k.id)).toEqual([
      'full_proposal', 'engineering_report', 'commercial_report', 'executive_summary', 'customer_summary',
    ])
  })

  it('engineering_report contains only engineering-relevant sections', () => {
    const doc = generateReport('engineering_report', inputs)
    expect(doc.sections.map(s => s.id)).toEqual([
      'cover', 'customer_project', 'engineering_summary', 'technical_specifications',
      'recommendations', 'warnings', 'company_details',
    ])
  })

  it('commercial_report contains only commercial sections', () => {
    const doc = generateReport('commercial_report', inputs)
    expect(doc.sections.map(s => s.id)).toEqual([
      'cover', 'customer_project', 'commercial_summary', 'boq', 'terms', 'company_details',
    ])
  })

  it('executive_summary is a slim customer-facing view', () => {
    const doc = generateReport('executive_summary', inputs)
    expect(doc.sections.length).toBe(5)
    expect(doc.sections.map(s => s.id)).toContain('project_summary')
  })

  it('customer_summary hides internal warnings section', () => {
    const doc = generateReport('customer_summary', inputs)
    expect(doc.sections.map(s => s.id)).not.toContain('warnings')
    expect(doc.sections.map(s => s.id)).toContain('boq')
  })
})
