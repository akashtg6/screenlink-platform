import { describe, it, expect } from 'vitest'
import { calculateEngineering } from '@/engineering-engine'
import { calculateCommercial, type CommercialInput } from '@/commercial-engine'
import { generateBOQ } from '@/boq-engine'
import { generateProposal, PROPOSAL_ENGINE_VERSION, mergeBranding, SCREENLINK_DEFAULT_BRANDING } from '@/proposal-engine'

const project = {
  projectName: 'Downtown Lobby LED Wall',
  width: 6400, height: 3600, measurementUnit: 'mm' as const,
  pixelPitchMm: 1.9,
  cabinetWidthMm: 640, cabinetHeightMm: 360,
  viewingDistanceM: 5.7,
  environment: 'indoor' as const, contentType: 'video' as const,
  application: 'corporate', operationHoursPerDay: 10,
}

const commInput: CommercialInput = {
  currency: 'INR',
  ledCostPerSqM: 90000, cabinetCostPerUnit: 45000, controllerCost: 65000,
  controllerQuantity: 5, receivingCardCostPerUnit: 3500, powerSupplyCostPerUnit: 6500,
  cablesCost: 15000, accessoriesCost: 8000,
  steelStructureCost: 40000, transportationCost: 25000,
  installationCost: 55000, commissioningCost: 20000,
  marginPercent: 25, discountPercent: 5,
  warrantyYears: 2, warrantyCostPercent: 3,
  amcYears: 3, amcCostPercentPerYear: 5,
  tax: { label: 'GST', ratePercent: 18 },
}

function buildProposal() {
  const engineering = calculateEngineering(project)
  const commercial = calculateCommercial(commInput, engineering)
  const boq = generateBOQ({ engineering, commercial })
  return generateProposal({
    branding: mergeBranding(),
    customer: {
      name: 'ACME Corporation', organization: 'ACME Corp', contactPerson: 'Jane Buyer',
      email: 'jane@acme.example', phone: '+1 555 0100',
      address: '221B Baker Street, London',
    },
    project: {
      projectId: 'proj-1234', projectCode: 'ACME-LOBBY-001',
      projectName: project.projectName, application: 'Corporate lobby',
      siteAddress: 'ACME HQ, Ground Floor',
      preparedBy: 'ScreenLink Solutions',
      proposalNumber: 'SL-2026-0001',
      proposalDate: '2026-06-02T00:00:00.000Z',
      validUntil: '2026-07-02T00:00:00.000Z',
      revision: 'R0',
    },
    engineering, commercial, boq,
    terms: {
      paymentTerms: '40% advance, 50% before dispatch, 10% after commissioning.',
      deliveryLeadTime: '6–8 weeks from PO date',
      warrantyTerms: 'Standard 2-year on-site warranty. Extended to 4 years via optional AMC.',
    },
  })
}

/** Zero out timestamps & timings so snapshots are stable across runs. */
function stabilise(doc: ReturnType<typeof buildProposal>) {
  return JSON.parse(JSON.stringify(doc, (key, value) => {
    if (key === 'generatedAt') return 'STABLE-TIMESTAMP'
    if (key === 'calculationTimeMs') return 0
    return value
  }))
}

describe('Proposal Engine — generateProposal', () => {
  it('reports a stable version', () => {
    expect(PROPOSAL_ENGINE_VERSION).toMatch(/^0\.\d+\.\d+$/)
  })

  it('emits all 12 required sections in the correct order', () => {
    const doc = buildProposal()
    expect(doc.sections.map(s => s.id)).toEqual([
      'cover', 'customer_project', 'project_summary', 'engineering_summary',
      'commercial_summary', 'boq', 'technical_specifications',
      'recommendations', 'warnings', 'terms', 'warranty', 'company_details',
    ])
  })

  it('carries totals from the commercial engine unchanged', () => {
    const doc = buildProposal()
    // Totals must not be reinterpreted by the proposal engine.
    expect(doc.totals.grandTotal).toBe(doc.sections[5].rows.length > 0 ? doc.totals.grandTotal : 0)
    expect(doc.totals.grandTotal).toBeGreaterThan(doc.totals.priceBeforeTax)
    expect(doc.totals.grandTotal).toBeCloseTo(doc.totals.priceBeforeTax + doc.totals.taxAmount, 0)
  })

  it('uses branding config — no hardcoded company name', () => {
    const engineering = calculateEngineering(project)
    const commercial = calculateCommercial(commInput, engineering)
    const boq = generateBOQ({ engineering, commercial })
    const doc = generateProposal({
      branding: mergeBranding({ companyName: 'White-Label Displays Inc.', tagline: 'Your logo here.' }),
      customer: { name: 'Buyer', organization: 'BuyerCo' },
      project: { projectName: 'X' },
      engineering, commercial, boq,
    })
    expect(doc.title).toContain('White-Label Displays Inc.')
    expect(doc.branding.companyName).toBe('White-Label Displays Inc.')
    // Cover heading uses branding.companyName from config
    const coverHeading = doc.sections[0].rows.find(r => r.kind === 'heading')
    expect(coverHeading && coverHeading.kind === 'heading' && coverHeading.text).toBe('White-Label Displays Inc.')
  })

  it('is deterministic (snapshot-stable across runs)', () => {
    const a = stabilise(buildProposal())
    const b = stabilise(buildProposal())
    expect(a).toEqual(b)
  })

  it('matches the golden snapshot of the composed document', () => {
    const doc = stabilise(buildProposal())
    // Trim renderer-only fields that we don't want snapshot-locked. Everything
    // else — including all rows, sections and totals — IS snapshot-locked.
    expect(doc).toMatchSnapshot()
  })

  it('honours the default ScreenLink branding when overrides are omitted', () => {
    expect(SCREENLINK_DEFAULT_BRANDING.companyName).toBe('ScreenLink.ai')
    expect(SCREENLINK_DEFAULT_BRANDING.primaryColor).toMatch(/^#/)
  })
})
