import type { LineItem } from '../models/commercial-input'

export interface Aggregates {
  materialCost: number
  laborCost: number
  installationCost: number
  infrastructureCost: number
  servicesCost: number
  postSaleCost: number
  totalCost: number
  taxableBase: number   // sum of taxable line amounts (pre margin/discount)
}

/** Sum line items by category and return the total cost plus taxable base. */
export function aggregateCategories(lines: ReadonlyArray<LineItem>): Aggregates {
  const sums = {
    material: 0, labor: 0, installation: 0, infrastructure: 0,
    services: 0, post_sale: 0, other: 0,
  } as Record<LineItem['category'], number>

  let taxableBase = 0

  for (const l of lines) {
    sums[l.category] = (sums[l.category] ?? 0) + l.amount
    if (l.taxable !== false) taxableBase += l.amount
  }

  const totalCost = Object.values(sums).reduce((a, b) => a + b, 0)

  return {
    materialCost:       round2(sums.material),
    laborCost:          round2(sums.labor),
    installationCost:   round2(sums.installation),
    infrastructureCost: round2(sums.infrastructure),
    servicesCost:       round2(sums.services),
    postSaleCost:       round2(sums.post_sale),
    totalCost:          round2(totalCost),
    taxableBase:        round2(taxableBase),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
