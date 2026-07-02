import type { ProjectData } from '../models/project-data'
import type { EngineeringMessage } from '../models/engineering-result'
import { LIMITS } from '../constants/units'
import { toMm } from '../utils/math'

/**
 * ProjectData validator. Produces errors (block calculation) + warnings + info.
 * Warnings do NOT block calculation; they are surfaced to the user.
 *
 * @pure
 */
export function validateProjectData(input: ProjectData): {
  errors: EngineeringMessage[]
  warnings: EngineeringMessage[]
  info: EngineeringMessage[]
} {
  const errors: EngineeringMessage[] = []
  const warnings: EngineeringMessage[] = []
  const info: EngineeringMessage[] = []

  // Required fields
  if (input.width === undefined || input.width === null) {
    errors.push(req('width'))
  }
  if (input.height === undefined || input.height === null) {
    errors.push(req('height'))
  }
  if (input.measurementUnit === undefined) {
    errors.push(req('measurementUnit'))
  }
  if (input.pixelPitchMm === undefined || input.pixelPitchMm === null) {
    errors.push(req('pixelPitchMm'))
  }

  if (errors.length > 0) return { errors, warnings, info }

  // Positivity & finiteness
  if (!Number.isFinite(input.width) || input.width <= 0) {
    errors.push(msg('INVALID_WIDTH', 'width', 'error', 'Width must be a positive number.'))
  }
  if (!Number.isFinite(input.height) || input.height <= 0) {
    errors.push(msg('INVALID_HEIGHT', 'height', 'error', 'Height must be a positive number.'))
  }
  if (!Number.isFinite(input.pixelPitchMm) || input.pixelPitchMm <= 0) {
    errors.push(msg('INVALID_PIXEL_PITCH', 'pixelPitchMm', 'error', 'Pixel pitch must be a positive number.'))
  }
  if (errors.length > 0) return { errors, warnings, info }

  // Dimensional bounds
  const widthMm = toMm(input.width, input.measurementUnit)
  const heightMm = toMm(input.height, input.measurementUnit)
  if (widthMm < LIMITS.minDimensionMm)
    warnings.push(msg('WIDTH_TOO_SMALL', 'width', 'warning', `Width (${widthMm.toFixed(0)} mm) is below the recommended minimum of ${LIMITS.minDimensionMm} mm.`))
  if (widthMm > LIMITS.maxDimensionMm)
    warnings.push(msg('WIDTH_TOO_LARGE', 'width', 'warning', `Width (${widthMm.toFixed(0)} mm) exceeds ${LIMITS.maxDimensionMm} mm — unusual for a single display.`))
  if (heightMm < LIMITS.minDimensionMm)
    warnings.push(msg('HEIGHT_TOO_SMALL', 'height', 'warning', `Height (${heightMm.toFixed(0)} mm) is below the recommended minimum of ${LIMITS.minDimensionMm} mm.`))
  if (heightMm > LIMITS.maxDimensionMm)
    warnings.push(msg('HEIGHT_TOO_LARGE', 'height', 'warning', `Height (${heightMm.toFixed(0)} mm) exceeds ${LIMITS.maxDimensionMm} mm.`))

  // Pixel pitch sanity
  if (input.pixelPitchMm < LIMITS.minPixelPitchMm)
    warnings.push(msg('PIXEL_PITCH_TOO_FINE', 'pixelPitchMm', 'warning',
      `Pixel pitch ${input.pixelPitchMm} mm is finer than the ${LIMITS.minPixelPitchMm} mm engineering minimum used by this calculator.`,
      'Verify with cabinet supplier that this pitch is manufacturable.'))
  if (input.pixelPitchMm > LIMITS.maxPixelPitchMm)
    warnings.push(msg('PIXEL_PITCH_TOO_COARSE', 'pixelPitchMm', 'warning',
      `Pixel pitch ${input.pixelPitchMm} mm is coarser than typical (>${LIMITS.maxPixelPitchMm} mm).`))

  // Viewing distance sanity
  if (input.viewingDistanceM !== undefined) {
    if (input.viewingDistanceM <= 0)
      warnings.push(msg('INVALID_VIEWING_DISTANCE', 'viewingDistanceM', 'warning', 'Viewing distance must be > 0 m.'))
    if (input.viewingDistanceM > LIMITS.maxViewingDistanceM)
      warnings.push(msg('VIEWING_DISTANCE_LARGE', 'viewingDistanceM', 'warning',
        `Viewing distance ${input.viewingDistanceM} m is unusually large.`))
  }

  // Operation hours
  if (input.operationHoursPerDay !== undefined) {
    if (input.operationHoursPerDay < 0 || input.operationHoursPerDay > LIMITS.maxOperationHoursPerDay)
      warnings.push(msg('INVALID_OPERATION_HOURS', 'operationHoursPerDay', 'warning',
        `Operation hours must be between 0 and 24. Received: ${input.operationHoursPerDay}.`))
  }

  // Cabinet fit informational check
  if (input.cabinetWidthMm && input.cabinetHeightMm) {
    const wRem = widthMm % input.cabinetWidthMm
    const hRem = heightMm % input.cabinetHeightMm
    if (wRem > 0.5 || hRem > 0.5)
      info.push(msg('CABINET_DOES_NOT_TILE', undefined, 'info',
        `Screen dimensions do not tile evenly with cabinet ${input.cabinetWidthMm}×${input.cabinetHeightMm} mm (remainders ${wRem.toFixed(1)}×${hRem.toFixed(1)} mm).`,
        'Consider adjusting screen dimensions to an integer multiple of the cabinet size.'))
  }

  return { errors, warnings, info }
}

function req(field: string): EngineeringMessage {
  return msg('MISSING_REQUIRED_FIELD', field, 'error', `Field "${field}" is required.`)
}
function msg(code: string, field: string | undefined, severity: EngineeringMessage['severity'], message: string, suggestion?: string): EngineeringMessage {
  return { code, field, severity, message, suggestion }
}
