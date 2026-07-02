import type { EngineeringResult } from '@/engineering-engine'
import type { CommercialInput, LineItem } from '../models/commercial-input'

let counter = 0
function id(prefix: string): string {
  counter += 1
  return `${prefix}-${counter.toString(36)}`
}

/**
 * Materialise the CommercialInput + EngineeringResult into a canonical list
 * of LineItems. This is the *only* place where quantity/price maths happens.
 * Every downstream aggregation reads the line list.
 *
 * Rules:
 *   - A line is included only if its quantity > 0 and its unitPrice > 0.
 *   - Quantities derive from the EngineeringResult (BOM). Missing pieces of
 *     engineering info are treated as `undefined` → the line is skipped.
 *   - Extra/custom lines from the input are appended as-is.
 */
export function buildLineItems(
  input: CommercialInput,
  eng: EngineeringResult | undefined,
): LineItem[] {
  counter = 0
  const lines: LineItem[] = []

  const areaSqM = eng?.geometry?.areaSqM
  const totalCabinets = eng?.cabinet?.totalCabinets
  const controllerQty = input.controllerQuantity ?? (totalCabinets ? Math.max(1, Math.ceil(totalCabinets / 8)) : 1)
  const receivingQty = totalCabinets ?? undefined
  const psuQty = totalCabinets ?? undefined

  // —— Materials ——
  push('mat-led', 'material',
    'LED Display Module (per m²)', areaSqM, 'm²', input.ledCostPerSqM)

  push('mat-cabinet', 'material',
    'Cabinet', totalCabinets, 'nos', input.cabinetCostPerUnit)

  push('mat-controller', 'material',
    'Display Controller / Sending Card', controllerQty, 'nos', input.controllerCost)

  push('mat-receiver', 'material',
    'Receiving Card', receivingQty, 'nos', input.receivingCardCostPerUnit)

  push('mat-psu', 'material',
    'Power Supply Unit', psuQty, 'nos', input.powerSupplyCostPerUnit)

  push('mat-cables', 'material',
    'Signal + Power Cables', 1, 'lot', input.cablesCost)

  push('mat-accessories', 'material',
    'Accessories & Mounting Hardware', 1, 'lot', input.accessoriesCost)

  // —— Infrastructure ——
  push('infra-steel', 'infrastructure',
    'Steel Support Structure', 1, 'lot', input.steelStructureCost)

  push('infra-transport', 'infrastructure',
    'Transportation & Logistics', 1, 'lot', input.transportationCost)

  // —— Services ——
  push('svc-install', 'installation',
    'Installation Labour', 1, 'lot', input.installationCost)

  push('svc-commission', 'services',
    'Commissioning & Testing', 1, 'lot', input.commissioningCost)

  // —— Post-sale ——
  const materialBase = lines.filter(l => l.category === 'material').reduce((a, l) => a + l.amount, 0)
  if ((input.warrantyYears ?? 0) > 0 && (input.warrantyCostPercent ?? 0) > 0 && materialBase > 0) {
    const amt = materialBase * ((input.warrantyCostPercent ?? 0) / 100)
    lines.push({
      id: id('warranty'), category: 'post_sale',
      description: `Extended Warranty (${input.warrantyYears} year${(input.warrantyYears ?? 0) > 1 ? 's' : ''})`,
      quantity: input.warrantyYears ?? 0, unit: 'year',
      unitPrice: input.warrantyYears ? amt / input.warrantyYears : amt,
      amount: amt, taxable: true,
    })
  }

  if ((input.amcYears ?? 0) > 0 && (input.amcCostPercentPerYear ?? 0) > 0 && materialBase > 0) {
    const amtPerYear = materialBase * ((input.amcCostPercentPerYear ?? 0) / 100)
    const totalAmt = amtPerYear * (input.amcYears ?? 0)
    lines.push({
      id: id('amc'), category: 'post_sale',
      description: `Annual Maintenance Contract (${input.amcYears} year${(input.amcYears ?? 0) > 1 ? 's' : ''})`,
      quantity: input.amcYears ?? 0, unit: 'year',
      unitPrice: amtPerYear, amount: totalAmt, taxable: true,
    })
  }

  // —— User-defined extras ——
  for (const extra of input.additionalMaterialLines ?? []) {
    const amount = round2((extra.quantity || 0) * (extra.unitPrice || 0))
    if (amount <= 0) continue
    lines.push({
      id: extra.id || id('custom-mat'),
      category: 'material',
      description: extra.description,
      quantity: extra.quantity,
      unit: extra.unit,
      unitPrice: extra.unitPrice,
      amount,
      taxable: extra.taxable ?? true,
      meta: extra.meta,
    })
  }
  for (const extra of input.additionalServiceLines ?? []) {
    const amount = round2((extra.quantity || 0) * (extra.unitPrice || 0))
    if (amount <= 0) continue
    lines.push({
      id: extra.id || id('custom-svc'),
      category: 'services',
      description: extra.description,
      quantity: extra.quantity,
      unit: extra.unit,
      unitPrice: extra.unitPrice,
      amount,
      taxable: extra.taxable ?? true,
      meta: extra.meta,
    })
  }

  return lines

  function push(
    prefix: string,
    category: LineItem['category'],
    description: string,
    quantity: number | undefined,
    unit: string,
    unitPrice: number | undefined,
  ) {
    if (!Number.isFinite(quantity) || !quantity || quantity <= 0) return
    if (!Number.isFinite(unitPrice) || !unitPrice || unitPrice <= 0) return
    const q = quantity as number
    const p = unitPrice as number
    lines.push({
      id: id(prefix), category, description,
      quantity: round2(q), unit, unitPrice: round2(p),
      amount: round2(q * p), taxable: true,
    })
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
