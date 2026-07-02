import { describe, it, expect } from 'vitest'
import { calculateEngineering } from '@/engineering-engine'
import { calculateCommercial, type CommercialInput } from '@/commercial-engine'
import { generateBOQ } from '@/boq-engine'
import { generateProposal, mergeBranding } from '@/proposal-engine'
import { renderWorkbookBlob, EXCEL_ENGINE_VERSION } from '@/excel-engine'

const engineering = calculateEngineering({
  projectName: 'Test',
  width: 6400, height: 3600, measurementUnit: 'mm',
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
const proposal = generateProposal({
  branding: mergeBranding(),
  customer: { name: 'ACME', organization: 'ACME Corp' },
  project: { projectName: 'Test project', proposalNumber: 'X-0001', revision: 'R0' },
  engineering, commercial, boq,
})

describe('Excel Engine — renderWorkbookBlob', () => {
  it('reports a stable version tag', () => {
    expect(EXCEL_ENGINE_VERSION).toMatch(/^0\.\d+\.\d+$/)
  })

  it('produces a non-trivial .xlsx blob', async () => {
    const blob = await renderWorkbookBlob({ engineering, commercial, boq, proposal })
    expect(blob).toBeInstanceOf(Blob)
    // A real xlsx (zip) is comfortably > 3 KB.
    expect(blob.size).toBeGreaterThan(3000)
    // MIME hint is the openxml spreadsheet type.
    expect(blob.type).toMatch(/spreadsheetml/)
  })

  it('produces a distinct blob when the underlying data changes', async () => {
    const [a, b] = await Promise.all([
      renderWorkbookBlob({ engineering, commercial, boq, proposal }),
      renderWorkbookBlob({ engineering, commercial: calculateCommercial({ ...commInput, marginPercent: 40 }, engineering), boq, proposal }),
    ])
    // Different data → different byte sizes (with high probability).
    expect(a.size).not.toEqual(b.size)
  })
})
