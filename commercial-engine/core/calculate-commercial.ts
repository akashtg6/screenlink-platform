import type { EngineeringResult } from '@/engineering-engine'
import type { CommercialInput } from '../models/commercial-input'
import type { CommercialResult, CostBreakdownEntry } from '../models/commercial-result'
import { buildLineItems } from '../calculators/line-items'
import { aggregateCategories } from '../calculators/aggregate'
import { applyMarginAndTax } from '../calculators/margin-tax'

export const COMMERCIAL_ENGINE_VERSION = '0.5.0'

/**
 * Pure, framework-agnostic entry point of the Commercial Engine.
 *
 *   Same input → same output. No side effects, no I/O.
 *
 * The engine takes:
 *   - `input`   — user-supplied unit costs, margins, taxes, warranty, etc.
 *   - `eng`    — pre-computed EngineeringResult (used only to derive quantities).
 *                 Passing `undefined` is legal — the engine still runs and
 *                 returns zero-quantity lines (useful for early UI states).
 *
 * The engine returns a serialisable `CommercialResult` with:
 *   - Every line item.
 *   - Every aggregation, margin, tax and profit number.
 *   - A pie-chart-ready `breakdown` array.
 *   - Non-fatal warnings.
 *
 * IMPORTANT: this engine never modifies its inputs.
 */
export function calculateCommercial(
  input: CommercialInput,
  eng?: EngineeringResult,
): CommercialResult {
  const started = now()

  const lineItems = buildLineItems(input, eng)
  const agg = aggregateCategories(lineItems)
  const pricing = applyMarginAndTax(input, agg)

  const breakdown = buildBreakdown(agg, pricing)

  return {
    currency: input.currency,

    lineItems,

    materialCost: agg.materialCost,
    laborCost: agg.laborCost,
    installationCost: agg.installationCost,
    infrastructureCost: agg.infrastructureCost,
    servicesCost: agg.servicesCost,
    postSaleCost: agg.postSaleCost,
    totalCost: agg.totalCost,

    marginPercent: pricing.marginPercent,
    grossMarginAmount: pricing.grossMarginAmount,
    discountPercent: pricing.discountPercent,
    discountAmount: pricing.discountAmount,
    netMarginAmount: pricing.netMarginAmount,

    priceBeforeDiscount: pricing.priceBeforeDiscount,
    priceBeforeTax: pricing.priceBeforeTax,
    tax: pricing.tax,
    taxAmount: pricing.taxAmount,
    sellingPrice: pricing.sellingPrice,

    profit: pricing.profit,
    effectiveMarginPercent: pricing.effectiveMarginPercent,
    effectiveMarkupPercent: pricing.effectiveMarkupPercent,

    breakdown,
    warnings: pricing.warnings,

    engineVersion: COMMERCIAL_ENGINE_VERSION,
    calculationTimeMs: Math.max(0, now() - started),
    generatedAt: new Date().toISOString(),
  }
}

function buildBreakdown(
  agg: ReturnType<typeof aggregateCategories>,
  _pricing: ReturnType<typeof applyMarginAndTax>,
): CostBreakdownEntry[] {
  const buckets: Array<[string, number]> = [
    ['Material',       agg.materialCost],
    ['Labor',          agg.laborCost],
    ['Installation',   agg.installationCost],
    ['Infrastructure', agg.infrastructureCost],
    ['Services',       agg.servicesCost],
    ['Post-sale',      agg.postSaleCost],
  ]
  const total = agg.totalCost || 1
  return buckets
    .filter(([, amt]) => amt > 0)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentOfTotal: Math.round((amount / total) * 10000) / 100,
    }))
}

/**
 * Monotonic clock in ms, fallback for non-DOM environments. Kept private so
 * the engine has zero external side effects.
 */
function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}
