/**
 * ScreenLink.ai Engineering Engine — Public API
 *
 * IMPORTANT: This module has ZERO dependencies on React, Supabase, Next.js,
 * or any UI framework. It can be extracted into a standalone npm package.
 */

export { calculateEngineering, ENGINE_VERSION } from './core/calculate-engineering'

// Individual calculators (advanced consumers only; UI should use calculateEngineering).
export { calculateAspectRatio } from './calculators/aspect-ratio'
export { calculateScreenGeometry } from './calculators/screen-geometry'
export { calculateResolution } from './calculators/resolution'
export { calculatePixelDensity } from './calculators/pixel-density'

// Validator
export { validateProjectData } from './validators/project-data-validator'

// Types
export type {
  ProjectData, InstallationType, DisplayFamily, Orientation, EnvironmentType, ContentClass,
} from './models/project-data'
export type {
  EngineeringResult, AspectRatioResult, ScreenGeometryResult, ResolutionResult, PixelDensityResult,
  EngineeringMessage, Severity,
} from './models/engineering-result'
export type { MeasurementUnit } from './constants/units'
export { STANDARD_ASPECT_RATIOS } from './constants/aspect-ratios'
export { RESOLUTION_CLASSES } from './constants/resolutions'
