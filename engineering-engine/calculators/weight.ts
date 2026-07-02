import { WEIGHT_DEFAULTS } from '../constants/engineering-defaults'
import { round } from '../utils/math'

export interface WeightResult {
  displayFamily: string
  massPerSqMKg: number
  totalDisplayWeightKg: number
  weightPerCabinetKg: number | null
  weightPerSqMKg: number
  // Reserved for Sprint 5 (structural)
  structuralLoadKN?: number
  centerOfGravityMm?: { x: number; y: number }
}

/**
 * MODULE 3 (4B) — Weight Engine.
 * Simple mass × area model. Structural (kN, CoG, wall load) is reserved.
 *
 * @pure
 */
export function calculateWeight(input: {
  screenAreaSqM: number
  totalCabinets?: number
  displayFamily?: 'led' | 'lcd' | 'transparent' | 'projection'
}): WeightResult {
  const family = input.displayFamily ?? 'led'
  const massPerSqM = WEIGHT_DEFAULTS.massPerSqM[family]
  const total = massPerSqM * input.screenAreaSqM
  return {
    displayFamily: family,
    massPerSqMKg: massPerSqM,
    totalDisplayWeightKg: round(total, 2),
    weightPerCabinetKg: input.totalCabinets ? round(total / input.totalCabinets, 2) : null,
    weightPerSqMKg: massPerSqM,
  }
}
