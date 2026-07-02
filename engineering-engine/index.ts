/**
 * ScreenLink.ai Engineering Engine — Public API (4B)
 */
export { calculateEngineering, ENGINE_VERSION } from './core/calculate-engineering'
export { calculateAspectRatio } from './calculators/aspect-ratio'
export { calculateScreenGeometry } from './calculators/screen-geometry'
export { calculateResolution } from './calculators/resolution'
export { calculatePixelDensity } from './calculators/pixel-density'
export { calculateCabinetLayout } from './calculators/cabinet'
export { calculatePower } from './calculators/power'
export { calculateWeight } from './calculators/weight'
export { calculateViewing } from './calculators/viewing'

export { validateProjectData } from './validators/project-data-validator'

export { evaluateRules, findingsToMessages } from './rules/rules-engine'
export { DEFAULT_RULES, suggestedPitchForApplication } from './rules/default-rules'
export { generateRecommendations } from './recommendations/recommendation-engine'
export { computeEngineeringScore } from './scoring/engineering-score'

export type { ProjectData, InstallationType, DisplayFamily, Orientation, EnvironmentType, ContentClass } from './models/project-data'
export type {
  EngineeringResult, EngineeringMessage, Severity,
  AspectRatioResult, ScreenGeometryResult, ResolutionResult, PixelDensityResult,
} from './models/engineering-result'
export type { CabinetLayout } from './calculators/cabinet'
export type { PowerResult } from './calculators/power'
export type { WeightResult } from './calculators/weight'
export type { ViewingResult } from './calculators/viewing'
export type { EngineeringRule, RuleFinding, RuleSeverity, RuleCategory, RecommendationHint } from './rules/rules-engine'
export type { Recommendation } from './recommendations/recommendation-engine'
export type { EngineeringScore } from './scoring/engineering-score'
export type { MeasurementUnit } from './constants/units'
export { STANDARD_ASPECT_RATIOS } from './constants/aspect-ratios'
export { RESOLUTION_CLASSES } from './constants/resolutions'
export { POWER_DEFAULTS, WEIGHT_DEFAULTS, VIEWING_DEFAULTS, BRIGHTNESS_DEFAULTS, PITCH_SUGGESTIONS } from './constants/engineering-defaults'

// React helper (client-side only)
export { useEngineering } from './react/use-engineering'
