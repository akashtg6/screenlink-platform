import type { EngineeringResult } from '@/engineering-engine'
import type { CommercialResult, LineItem } from '@/commercial-engine'
import type { CurrencyCode } from '@/commercial-engine'

/**
 * The 12 canonical BOQ sections requested by product. Ordering is stable so
 * the PDF/Excel exporters can rely on it.
 */
export type BOQSectionId =
  | 'display'
  | 'cabinets'
  | 'controllers'
  | 'receiving_cards'
  | 'power_supplies'
  | 'cables'
  | 'steel'
  | 'accessories'
  | 'installation'
  | 'commissioning'
  | 'warranty'
  | 'amc'

export interface BOQItem {
  readonly id: string
  readonly description: string
  readonly quantity: number
  readonly unit: string
  readonly unitPrice: number
  readonly amount: number
  readonly editable: boolean
  readonly meta?: Readonly<Record<string, unknown>>
}

export interface BOQSection {
  readonly id: BOQSectionId
  readonly title: string
  readonly description?: string
  readonly items: ReadonlyArray<BOQItem>
  readonly subtotal: number
}

export interface BOQDocument {
  readonly currency: CurrencyCode
  readonly sections: ReadonlyArray<BOQSection>
  readonly grandSubtotal: number
  readonly discountAmount: number
  readonly priceBeforeTax: number
  readonly taxLabel: string
  readonly taxRatePercent: number
  readonly taxAmount: number
  readonly grandTotal: number
  readonly meta: {
    readonly generatedAt: string
    readonly engineVersion: string
    readonly sourceEngineeringVersion?: string
    readonly sourceCommercialVersion: string
  }
}

/** Optional inputs that let the BOQ engine enrich section descriptions. */
export interface BOQInputs {
  readonly engineering?: EngineeringResult
  readonly commercial: CommercialResult
  readonly headerNotes?: Readonly<Record<BOQSectionId, string>>
}

export type { LineItem }
