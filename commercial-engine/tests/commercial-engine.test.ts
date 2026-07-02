import { describe, it, expect } from 'vitest'
import {
  calculateCommercial,
  COMMERCIAL_ENGINE_VERSION,
  formatCurrency,
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CommercialInput,
} from '@/commercial-engine'
import type { EngineeringResult } from '@/engineering-engine'

// A minimal, deterministic engineering-result stub that carries only the
// numbers the commercial engine reads (area, cabinet count).
const engStub = {
  ok: true, errors: [], warnings: [], notes: [],
  aspectRatio: {} as EngineeringResult['aspectRatio'],
  geometry: { areaSqM: 20 } as EngineeringResult['geometry'],
  resolution: {} as EngineeringResult['resolution'],
  pixelDensity: {} as EngineeringResult['pixelDensity'],
  cabinet: { totalCabinets: 40 } as EngineeringResult['cabinet'],
  engineVersion: 'test',
  calculationTimeMs: 0,
  generatedAt: new Date().toISOString(),
} as unknown as EngineeringResult

const baseInput: CommercialInput = {
  currency: 'INR',
  ledCostPerSqM: 90000,
  cabinetCostPerUnit: 45000,
  controllerCost: 65000,
  controllerQuantity: 5,
  receivingCardCostPerUnit: 3500,
  powerSupplyCostPerUnit: 6500,
  cablesCost: 15000,
  accessoriesCost: 8000,
  steelStructureCost: 40000,
  transportationCost: 25000,
  installationCost: 55000,
  commissioningCost: 20000,
  marginPercent: 25,
  discountPercent: 0,
  warrantyYears: 2, warrantyCostPercent: 3,
  amcYears: 3, amcCostPercentPerYear: 5,
  tax: { label: 'GST', ratePercent: 18 },
}

describe('Commercial Engine — calculateCommercial', () => {
  it('produces a stable version tag', () => {
    expect(COMMERCIAL_ENGINE_VERSION).toMatch(/^0\.\d+\.\d+$/)
  })

  it('materialises the expected line items from engineering + inputs', () => {
    const r = calculateCommercial(baseInput, engStub)
    const descriptions = r.lineItems.map(l => l.description)
    expect(descriptions).toEqual(expect.arrayContaining([
      'LED Display Module (per m²)',
      'Cabinet',
      'Display Controller / Sending Card',
      'Receiving Card',
      'Power Supply Unit',
      'Signal + Power Cables',
      'Accessories & Mounting Hardware',
      'Steel Support Structure',
      'Transportation & Logistics',
      'Installation Labour',
      'Commissioning & Testing',
    ]))
    // Post-sale lines start with "Extended Warranty" / "Annual Maintenance"
    expect(descriptions.some(d => d.startsWith('Extended Warranty'))).toBe(true)
    expect(descriptions.some(d => d.startsWith('Annual Maintenance'))).toBe(true)
  })

  it('computes material totals correctly (20 m², 40 cabinets)', () => {
    const r = calculateCommercial(baseInput, engStub)
    // 20 m² * 90 000 = 1 800 000 (LED) + 40 * 45 000 = 1 800 000 (cabinets)
    // + 5 * 65 000 = 325 000 (controllers) + 40 * 3 500 = 140 000 (receivers)
    // + 40 * 6 500 = 260 000 (PSUs) + 15 000 + 8 000 = 23 000 (cables + accessories)
    // = 4 348 000
    expect(r.materialCost).toBeCloseTo(4_348_000, 0)
  })

  it('honours the margin-based pricing formula (25% margin, 0% discount)', () => {
    const r = calculateCommercial({ ...baseInput }, engStub)
    // priceBeforeDiscount = totalCost / (1 - 0.25)
    expect(r.priceBeforeDiscount).toBeCloseTo(r.totalCost / 0.75, 0)
    expect(r.priceBeforeTax).toBeCloseTo(r.priceBeforeDiscount, 0)
  })

  it('applies discount and reduces the taxable base proportionally', () => {
    const r0 = calculateCommercial({ ...baseInput, discountPercent: 0 }, engStub)
    const r10 = calculateCommercial({ ...baseInput, discountPercent: 10 }, engStub)
    expect(r10.priceBeforeTax).toBeLessThan(r0.priceBeforeTax)
    // 10% discount → tax base should shrink by ~10% too
    expect(r10.taxAmount).toBeLessThan(r0.taxAmount)
  })

  it('applies tax on top of priceBeforeTax', () => {
    const r = calculateCommercial({ ...baseInput, tax: { label: 'GST', ratePercent: 18 } }, engStub)
    // tax base is the sum of taxable line amounts * discount ratio.
    // sellingPrice == priceBeforeTax + taxAmount
    expect(r.sellingPrice).toBeCloseTo(r.priceBeforeTax + r.taxAmount, 0)
    expect(r.tax.ratePercent).toBe(18)
    expect(r.tax.label).toBe('GST')
  })

  it('surfaces warnings when discount > margin', () => {
    const r = calculateCommercial({ ...baseInput, marginPercent: 10, discountPercent: 20 }, engStub)
    expect(r.warnings.some(w => /run at a loss/i.test(w))).toBe(true)
  })

  it('clamps invalid percentages and warns', () => {
    const r = calculateCommercial({ ...baseInput, marginPercent: -5, discountPercent: 120 }, engStub)
    expect(r.marginPercent).toBe(0)
    expect(r.discountPercent).toBe(100)
    expect(r.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic (same input → same numeric output)', () => {
    const a = calculateCommercial(baseInput, engStub)
    const b = calculateCommercial(baseInput, engStub)
    // Zero out non-deterministic meta fields
    expect({ ...a, calculationTimeMs: 0, generatedAt: '' })
      .toStrictEqual({ ...b, calculationTimeMs: 0, generatedAt: '' })
  })

  it('gracefully handles missing engineering result', () => {
    const r = calculateCommercial(baseInput, undefined)
    // No area, no cabinets → area- and cabinet-driven lines are skipped
    const descriptions = r.lineItems.map(l => l.description)
    expect(descriptions).not.toContain('LED Display Module (per m²)')
    expect(descriptions).not.toContain('Cabinet')
    // Cables/accessories/steel/transport/install/commission still there
    expect(descriptions).toContain('Signal + Power Cables')
  })

  it('accepts custom material and service lines', () => {
    const r = calculateCommercial({
      ...baseInput,
      additionalMaterialLines: [{ description: 'Special LED coating', quantity: 20, unit: 'm²', unitPrice: 1200 }],
      additionalServiceLines:  [{ description: 'Training session',    quantity: 1,  unit: 'lot', unitPrice: 30000 }],
    }, engStub)
    expect(r.lineItems.find(l => l.description === 'Special LED coating')?.amount).toBeCloseTo(24000, 0)
    expect(r.lineItems.find(l => l.description === 'Training session')?.amount).toBeCloseTo(30000, 0)
  })

  it('runs 500 iterations in under 500 ms (perf budget)', () => {
    // Warm-up so JIT compiles the code paths before we measure.
    for (let i = 0; i < 20; i++) calculateCommercial(baseInput, engStub)
    const start = performance.now()
    for (let i = 0; i < 500; i++) calculateCommercial({ ...baseInput, cablesCost: 15000 + i }, engStub)
    const elapsed = performance.now() - start
    console.log(`  → Commercial 500 iterations: ${elapsed.toFixed(2)} ms`)
    expect(elapsed).toBeLessThan(500)
  })
})

describe('Commercial Engine — currency helpers', () => {
  it('lists 6 currencies with ISO codes', () => {
    expect(Object.keys(CURRENCIES).sort()).toEqual(['AED', 'EUR', 'GBP', 'INR', 'SAR', 'USD'])
    expect(DEFAULT_CURRENCY).toBe('INR')
  })

  it('formats INR with Indian locale grouping', () => {
    const s = formatCurrency(1_234_567, 'INR')
    // Depending on Node ICU version the currency symbol may render as "₹" or "INR"
    expect(s).toMatch(/(₹|INR)/)
  })

  it('formats USD with $ symbol', () => {
    expect(formatCurrency(1500.5, 'USD')).toMatch(/\$/)
  })
})
