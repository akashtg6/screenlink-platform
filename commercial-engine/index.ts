// Public API of the Commercial Engine.
// UI, adapters and other engines MUST import from this module only.

export { calculateCommercial, COMMERCIAL_ENGINE_VERSION } from './core/calculate-commercial'

export { CURRENCIES, DEFAULT_CURRENCY, formatCurrency } from './constants/currencies'
export type { CurrencyCode, CurrencyMeta } from './constants/currencies'

export { COMMERCIAL_DEFAULTS } from './constants/commercial-defaults'

export type {
  CommercialInput,
  TaxConfig,
  LineItem,
  LineItemCategory,
} from './models/commercial-input'

export type {
  CommercialResult,
  CostBreakdownEntry,
} from './models/commercial-result'
