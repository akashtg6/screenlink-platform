import type { CurrencyCode } from '../constants/currencies'
import type { LineItem, TaxConfig } from './commercial-input'

export interface CostBreakdownEntry {
  readonly category: string
  readonly amount: number
  readonly percentOfTotal: number
}

export interface CommercialResult {
  readonly currency: CurrencyCode

  // —— Line items (source of truth) ——
  readonly lineItems: ReadonlyArray<LineItem>

  // —— Aggregations by category ——
  readonly materialCost: number
  readonly laborCost: number
  readonly installationCost: number
  readonly infrastructureCost: number
  readonly servicesCost: number
  readonly postSaleCost: number

  // —— Cost totals ——
  readonly totalCost: number                // sum of all input costs (materials + labor + …)

  // —— Margin & discount ——
  readonly marginPercent: number
  readonly grossMarginAmount: number        // priceBeforeDiscount – totalCost
  readonly discountPercent: number
  readonly discountAmount: number
  readonly netMarginAmount: number          // gross – discount effect on margin

  // —— Pricing ——
  readonly priceBeforeDiscount: number      // totalCost / (1 – margin/100)
  readonly priceBeforeTax: number           // priceBeforeDiscount – discountAmount
  readonly tax: TaxConfig
  readonly taxAmount: number
  readonly sellingPrice: number             // priceBeforeTax + taxAmount

  // —— Profit view ——
  readonly profit: number                   // priceBeforeTax – totalCost
  readonly effectiveMarginPercent: number   // profit / priceBeforeTax * 100
  readonly effectiveMarkupPercent: number   // profit / totalCost * 100

  // —— Presentation aids ——
  readonly breakdown: ReadonlyArray<CostBreakdownEntry>

  // —— Warnings / notes surfaced by the engine ——
  readonly warnings: ReadonlyArray<string>

  // —— Meta ——
  readonly engineVersion: string
  readonly calculationTimeMs: number
  readonly generatedAt: string
}
