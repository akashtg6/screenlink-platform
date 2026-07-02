import type { CurrencyCode } from '@/commercial-engine'
import { formatCurrency } from '@/commercial-engine'

export function fmt(value: number, currency: CurrencyCode): string {
  return formatCurrency(value, currency)
}

export function pct(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`
}

export function num(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function shortDate(iso?: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toISOString().slice(0, 10) } catch { return iso }
}
