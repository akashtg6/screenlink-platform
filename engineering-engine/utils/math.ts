import { UNIT_TO_MM, type MeasurementUnit } from '../constants/units'

/** Convert a value from any supported unit to millimetres. */
export function toMm(value: number, unit: MeasurementUnit): number {
  const factor = UNIT_TO_MM[unit]
  if (factor === undefined) throw new Error(`Unsupported unit: ${unit}`)
  return value * factor
}

/** Convert millimetres to inches (25.4 mm = 1"). */
export function mmToInch(mm: number): number {
  return mm / 25.4
}

/** Convert millimetres to metres. */
export function mmToM(mm: number): number {
  return mm / 1000
}

/** Euclidean greatest common divisor for positive integers. */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) { [a, b] = [b, a % b] }
  return a || 1
}

/** Round to `decimals` decimals. Uses bankers' rounding via toFixed to avoid IEEE-754 noise. */
export function round(n: number, decimals = 2): number {
  if (!Number.isFinite(n)) return NaN
  const p = Math.pow(10, decimals)
  return Math.round(n * p) / p
}

/** Clamp a numeric value between two bounds. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}
