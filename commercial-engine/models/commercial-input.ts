import type { CurrencyCode } from '../constants/currencies'

export type LineItemCategory =
  | 'material'
  | 'labor'
  | 'installation'
  | 'infrastructure'
  | 'services'
  | 'post_sale'
  | 'other'

/**
 * A generic line item that any engine can produce. The shape is intentionally
 * flat so it survives JSON serialisation, DB persistence and cross-engine
 * transport unchanged.
 */
export interface LineItem {
  readonly id: string                 // stable identifier (uuid, slug, or hash)
  readonly category: LineItemCategory
  readonly description: string
  readonly quantity: number
  readonly unit: string               // 'nos', 'm²', 'set', 'lot', 'year', 'metre' …
  readonly unitPrice: number
  readonly amount: number             // quantity * unitPrice (always derived)
  readonly taxable?: boolean          // if false, this line is excluded from tax base
  readonly taxRateOverride?: number   // reserved — line-item tax (future)
  readonly meta?: Readonly<Record<string, unknown>>
}

export interface TaxConfig {
  readonly label: string              // 'GST' | 'VAT' | 'Sales Tax' | …
  readonly ratePercent: number        // 0–100
  /** Reserved for future compound-tax models (e.g., CGST + SGST). */
  readonly components?: ReadonlyArray<{ label: string; ratePercent: number }>
}

/**
 * Input to the Commercial Engine. All monetary values are in the same
 * `currency`. The engine never converts currencies — that's the caller's
 * concern.
 *
 * All numeric fields are optional; a user may fill just a subset. When a
 * value is missing, the engine either uses a default or omits the line.
 */
export interface CommercialInput {
  readonly currency: CurrencyCode
  readonly tax?: TaxConfig

  // —— Materials ——
  readonly ledCostPerSqM?: number
  readonly ledCostPerCabinet?: number
  readonly cabinetCostPerUnit?: number
  readonly controllerCost?: number
  readonly controllerQuantity?: number
  readonly receivingCardCostPerUnit?: number
  readonly powerSupplyCostPerUnit?: number
  readonly cablesCost?: number
  readonly accessoriesCost?: number

  // —— Infrastructure ——
  readonly steelStructureCost?: number
  readonly transportationCost?: number

  // —— Services ——
  readonly installationCost?: number
  readonly commissioningCost?: number

  // —— Business ——
  /** Margin applied on cost (not markup). Selling = cost / (1 - margin/100). */
  readonly marginPercent?: number
  readonly discountPercent?: number

  // —— Post-sale ——
  readonly warrantyYears?: number
  readonly warrantyCostPercent?: number
  readonly amcYears?: number
  readonly amcCostPercentPerYear?: number

  // —— Custom lines (fully user-driven) ——
  readonly additionalMaterialLines?: ReadonlyArray<Omit<LineItem, 'id' | 'category' | 'amount'> & { id?: string }>
  readonly additionalServiceLines?: ReadonlyArray<Omit<LineItem, 'id' | 'category' | 'amount'> & { id?: string }>

  /** Escape hatch for provider-specific fields; the engine ignores unknown keys. */
  readonly extras?: Readonly<Record<string, unknown>>
}
