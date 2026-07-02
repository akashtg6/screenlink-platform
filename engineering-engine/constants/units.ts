/** Measurement units supported by the engine. Everything is normalised to millimetres internally. */
export type MeasurementUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft'

export const UNIT_TO_MM: Readonly<Record<MeasurementUnit, number>> = Object.freeze({
  mm: 1,
  cm: 10,
  m: 1000,
  inch: 25.4,
  ft: 304.8,
})

/** Reasonable engineering bounds — used only for validation warnings, not hard errors. */
export const LIMITS = Object.freeze({
  minDimensionMm: 100,            // 0.1 m minimum
  maxDimensionMm: 200_000,        // 200 m maximum
  minPixelPitchMm: 0.3,
  maxPixelPitchMm: 40,
  minViewingDistanceM: 0.2,
  maxViewingDistanceM: 500,
  minOperationHoursPerDay: 0,
  maxOperationHoursPerDay: 24,
})
