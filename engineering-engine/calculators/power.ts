import type { ContentClass } from '../models/project-data'
import { POWER_DEFAULTS } from '../constants/engineering-defaults'
import { round } from '../utils/math'

export interface PowerResult {
  displayFamily: string
  maxWatts: number
  typicalWatts: number
  powerPerCabinetMaxW: number | null
  powerPerCabinetTypicalW: number | null
  wattsPerSqMMax: number
  wattsPerSqMTypical: number
  dailyKWh: number
  monthlyKWh: number
  annualKWh: number
  operationHoursPerDay: number
  typicalFactor: number
}

/**
 * MODULE 2 (4B) — Power Engine.
 * Uses industry-typical W/m² values (see constants/engineering-defaults.ts).
 * Downstream engines can multiply by tariff to derive cost — the type is
 * additive-friendly.
 *
 * @pure
 */
export function calculatePower(input: {
  screenAreaSqM: number
  totalCabinets?: number
  displayFamily?: 'led' | 'lcd' | 'transparent' | 'projection'
  contentType?: ContentClass
  operationHoursPerDay?: number
}): PowerResult {
  const family = input.displayFamily ?? 'led'
  const wattsPerSqMMax = POWER_DEFAULTS.maxWattsPerSqM[family]
  const typicalFactor = (input.contentType && POWER_DEFAULTS.typicalFactor[input.contentType])
    ?? POWER_DEFAULTS.defaultTypicalFactor
  const wattsPerSqMTypical = wattsPerSqMMax * typicalFactor
  const maxWatts = wattsPerSqMMax * input.screenAreaSqM
  const typicalWatts = wattsPerSqMTypical * input.screenAreaSqM
  const hours = clampHours(input.operationHoursPerDay ?? 10)
  const dailyKWh = (typicalWatts * hours) / 1000
  const monthlyKWh = dailyKWh * 30
  const annualKWh = dailyKWh * 365

  return {
    displayFamily: family,
    maxWatts: round(maxWatts, 2),
    typicalWatts: round(typicalWatts, 2),
    powerPerCabinetMaxW: input.totalCabinets ? round(maxWatts / input.totalCabinets, 2) : null,
    powerPerCabinetTypicalW: input.totalCabinets ? round(typicalWatts / input.totalCabinets, 2) : null,
    wattsPerSqMMax,
    wattsPerSqMTypical: round(wattsPerSqMTypical, 2),
    dailyKWh: round(dailyKWh, 2),
    monthlyKWh: round(monthlyKWh, 1),
    annualKWh: round(annualKWh, 0),
    operationHoursPerDay: hours,
    typicalFactor,
  }
}

function clampHours(h: number) { return Math.max(0, Math.min(24, h)) }
