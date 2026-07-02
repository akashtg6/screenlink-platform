import { describe, it, expect } from 'vitest'
import { calculateCommercial, type CommercialInput } from '@/commercial-engine'
import { generateBOQ, BOQ_ENGINE_VERSION } from '@/boq-engine'
import type { EngineeringResult } from '@/engineering-engine'

const eng = {
  ok: true, errors: [], warnings: [], notes: [],
  aspectRatio: {} as EngineeringResult['aspectRatio'],
  geometry: { areaSqM: 20 } as EngineeringResult['geometry'],
  resolution: {} as EngineeringResult['resolution'],
  pixelDensity: {} as EngineeringResult['pixelDensity'],
  cabinet: { totalCabinets: 40 } as EngineeringResult['cabinet'],
  engineVersion: '4B.0.0',
  calculationTimeMs: 0,
  generatedAt: new Date().toISOString(),
} as unknown as EngineeringResult

const commInput: CommercialInput = {
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
  warrantyYears: 2, warrantyCostPercent: 3,
  amcYears: 3, amcCostPercentPerYear: 5,
  tax: { label: 'GST', ratePercent: 18 },
}

describe('BOQ Engine — generateBOQ', () => {
  it('emits all 12 canonical sections, in the correct order', () => {
    const comm = calculateCommercial(commInput, eng)
    const boq = generateBOQ({ engineering: eng, commercial: comm })
    expect(boq.sections.map(s => s.id)).toEqual([
      'display','cabinets','controllers','receiving_cards','power_supplies',
      'cables','steel','accessories','installation','commissioning','warranty','amc',
    ])
  })

  it('classifies lines into the expected sections', () => {
    const comm = calculateCommercial(commInput, eng)
    const boq = generateBOQ({ engineering: eng, commercial: comm })

    expect(boq.sections.find(s => s.id === 'display')?.items[0].description)
      .toBe('LED Display Module (per m²)')
    expect(boq.sections.find(s => s.id === 'cabinets')?.items[0].description).toBe('Cabinet')
    expect(boq.sections.find(s => s.id === 'controllers')?.items[0].description).toBe('Display Controller / Sending Card')
    expect(boq.sections.find(s => s.id === 'receiving_cards')?.items[0].description).toBe('Receiving Card')
    expect(boq.sections.find(s => s.id === 'power_supplies')?.items[0].description).toBe('Power Supply Unit')
    expect(boq.sections.find(s => s.id === 'cables')?.items[0].description).toBe('Signal + Power Cables')
    expect(boq.sections.find(s => s.id === 'steel')?.items[0].description).toBe('Steel Support Structure')
    expect(boq.sections.find(s => s.id === 'accessories')?.items[0].description).toBe('Accessories & Mounting Hardware')
    expect(boq.sections.find(s => s.id === 'installation')?.items[0].description).toMatch(/Transportation|Installation/)
    expect(boq.sections.find(s => s.id === 'commissioning')?.items[0].description).toBe('Commissioning & Testing')
    expect(boq.sections.find(s => s.id === 'warranty')?.items.length).toBeGreaterThan(0)
    expect(boq.sections.find(s => s.id === 'amc')?.items.length).toBeGreaterThan(0)
  })

  it("section subtotals sum to the commercial engine's total cost", () => {
    const comm = calculateCommercial(commInput, eng)
    const boq = generateBOQ({ engineering: eng, commercial: comm })
    // sum(section.subtotal) == commercial.totalCost (the BOQ is the cost view)
    expect(boq.grandSubtotal).toBeCloseTo(comm.totalCost, 0)
  })

  it('carries discount, tax and grand total from the Commercial engine', () => {
    const comm = calculateCommercial({ ...commInput, discountPercent: 5 }, eng)
    const boq = generateBOQ({ engineering: eng, commercial: comm })
    expect(boq.discountAmount).toBe(comm.discountAmount)
    expect(boq.taxAmount).toBe(comm.taxAmount)
    expect(boq.taxLabel).toBe('GST')
    expect(boq.taxRatePercent).toBe(18)
    expect(boq.grandTotal).toBe(comm.sellingPrice)
  })

  it('reports its own version + the upstream engineering & commercial versions', () => {
    const comm = calculateCommercial(commInput, eng)
    const boq = generateBOQ({ engineering: eng, commercial: comm })
    expect(boq.meta.engineVersion).toBe(BOQ_ENGINE_VERSION)
    expect(boq.meta.sourceCommercialVersion).toBe(comm.engineVersion)
    expect(boq.meta.sourceEngineeringVersion).toBe('4B.0.0')
  })

  it('is deterministic (same inputs → identical section subtotals)', () => {
    const c1 = calculateCommercial(commInput, eng)
    const c2 = calculateCommercial(commInput, eng)
    const b1 = generateBOQ({ engineering: eng, commercial: c1 })
    const b2 = generateBOQ({ engineering: eng, commercial: c2 })
    expect(b1.sections.map(s => s.subtotal)).toEqual(b2.sections.map(s => s.subtotal))
  })
})
