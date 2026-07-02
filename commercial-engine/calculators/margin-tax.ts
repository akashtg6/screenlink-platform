import type { CommercialInput, TaxConfig } from '../models/commercial-input'
import type { Aggregates } from './aggregate'
import { COMMERCIAL_DEFAULTS } from '../constants/commercial-defaults'

export interface Pricing {
  marginPercent: number
  discountPercent: number

  priceBeforeDiscount: number
  discountAmount: number
  priceBeforeTax: number

  grossMarginAmount: number
  netMarginAmount: number

  tax: TaxConfig
  taxAmount: number
  sellingPrice: number

  profit: number
  effectiveMarginPercent: number
  effectiveMarkupPercent: number

  warnings: string[]
}

/**
 * Apply margin, discount and tax to the aggregated cost. All maths lives here
 * so that the model can be reasoned about (and unit-tested) independently.
 *
 * Formula reference (see docs/COMMERCIAL-ENGINE.md):
 *   priceBeforeDiscount = totalCost / (1 – margin/100)      [margin-based pricing]
 *   discountAmount      = priceBeforeDiscount · discount/100
 *   priceBeforeTax      = priceBeforeDiscount – discountAmount
 *   taxAmount           = taxableBase′ · taxRate/100
 *   sellingPrice        = priceBeforeTax + taxAmount
 *
 * Where `taxableBase′` is the taxable base scaled proportionally to the
 * discount applied on the priceBeforeDiscount (so discount reduces tax fairly).
 */
export function applyMarginAndTax(input: CommercialInput, agg: Aggregates): Pricing {
  const warnings: string[] = []

  const marginPercent = clampPct(input.marginPercent ?? COMMERCIAL_DEFAULTS.marginPercent, 'margin', warnings)
  const discountPercent = clampPct(input.discountPercent ?? COMMERCIAL_DEFAULTS.discountPercent, 'discount', warnings)

  if (marginPercent >= 99) warnings.push('Margin is unrealistically high (≥99%). Prices will be extreme.')
  if (discountPercent > marginPercent) warnings.push('Discount is higher than the margin — the project will run at a loss.')

  const priceBeforeDiscount = agg.totalCost > 0 ? agg.totalCost / (1 - marginPercent / 100) : 0
  const discountAmount = priceBeforeDiscount * (discountPercent / 100)
  const priceBeforeTax = priceBeforeDiscount - discountAmount

  const grossMarginAmount = priceBeforeDiscount - agg.totalCost
  const netMarginAmount = priceBeforeTax - agg.totalCost

  const tax = normaliseTax(input.tax)
  const discountRatio = priceBeforeDiscount > 0 ? priceBeforeTax / priceBeforeDiscount : 1
  const taxableBaseAfterDiscount = agg.taxableBase * discountRatio
  const taxAmount = taxableBaseAfterDiscount * (tax.ratePercent / 100)
  const sellingPrice = priceBeforeTax + taxAmount

  const profit = netMarginAmount
  const effectiveMarginPercent = priceBeforeTax > 0 ? (profit / priceBeforeTax) * 100 : 0
  const effectiveMarkupPercent = agg.totalCost > 0 ? (profit / agg.totalCost) * 100 : 0

  return {
    marginPercent,
    discountPercent,
    priceBeforeDiscount: round2(priceBeforeDiscount),
    discountAmount: round2(discountAmount),
    priceBeforeTax: round2(priceBeforeTax),
    grossMarginAmount: round2(grossMarginAmount),
    netMarginAmount: round2(netMarginAmount),
    tax,
    taxAmount: round2(taxAmount),
    sellingPrice: round2(sellingPrice),
    profit: round2(profit),
    effectiveMarginPercent: round2(effectiveMarginPercent),
    effectiveMarkupPercent: round2(effectiveMarkupPercent),
    warnings,
  }
}

function clampPct(v: number, label: string, warnings: string[]): number {
  if (!Number.isFinite(v)) { warnings.push(`Invalid ${label} percentage — defaulting to 0.`); return 0 }
  if (v < 0)   { warnings.push(`${label} percentage was negative — clamped to 0.`); return 0 }
  if (v > 100) { warnings.push(`${label} percentage exceeded 100 — clamped to 100.`); return 100 }
  return v
}

function normaliseTax(t?: TaxConfig): TaxConfig {
  if (!t) return COMMERCIAL_DEFAULTS.defaultTax
  const rate = Number.isFinite(t.ratePercent) ? Math.max(0, Math.min(100, t.ratePercent)) : 0
  return { label: t.label || 'Tax', ratePercent: rate, components: t.components }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
