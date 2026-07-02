/**
 * ISO-4217 currency registry used across the Commercial, BOQ and Proposal
 * engines. The set is intentionally small (business-configured) but the
 * shape allows a straightforward extension: add a new entry, everything
 * downstream picks it up because callers reason in ISO codes only.
 */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR'

export interface CurrencyMeta {
  readonly code: CurrencyCode
  readonly name: string
  readonly symbol: string
  readonly locale: string           // BCP-47 tag for Intl.NumberFormat
  readonly minorUnitDigits: number  // 2 for most; 0 for JPY-style. Kept for future.
}

export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyMeta>> = Object.freeze({
  INR: { code: 'INR', name: 'Indian Rupee',       symbol: '₹',  locale: 'en-IN', minorUnitDigits: 2 },
  USD: { code: 'USD', name: 'US Dollar',          symbol: '$',  locale: 'en-US', minorUnitDigits: 2 },
  EUR: { code: 'EUR', name: 'Euro',               symbol: '€',  locale: 'en-IE', minorUnitDigits: 2 },
  GBP: { code: 'GBP', name: 'Pound Sterling',     symbol: '£',  locale: 'en-GB', minorUnitDigits: 2 },
  AED: { code: 'AED', name: 'UAE Dirham',         symbol: 'AED', locale: 'en-AE', minorUnitDigits: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal',        symbol: 'SAR', locale: 'en-SA', minorUnitDigits: 2 },
})

export const DEFAULT_CURRENCY: CurrencyCode = 'INR'

/** Format an amount using Intl. Locale-safe on both Node and browser. */
export function formatCurrency(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES[DEFAULT_CURRENCY]
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      maximumFractionDigits: meta.minorUnitDigits,
    }).format(amount)
  } catch {
    // Safety net for exotic runtimes.
    return `${meta.symbol} ${amount.toFixed(meta.minorUnitDigits)}`
  }
}
