import type { EngineeringRule } from './rules-engine'
import { BRIGHTNESS_DEFAULTS, PITCH_SUGGESTIONS } from '../constants/engineering-defaults'

/**
 * Default library of engineering rules.
 * Consumers can pass their own array to `evaluateRules` for org-specific overrides.
 */
export const DEFAULT_RULES: EngineeringRule[] = [
  // R-01: Fine-pitch required for text-heavy applications
  {
    id: 'PITCH_TOO_COARSE_FOR_TEXT',
    description: 'Pixel pitch is too coarse for text-heavy content (control rooms, dashboards, PowerPoint).',
    category: 'display', severity: 'warning',
    when: (i) => {
      const textApps = ['control_room', 'powerpoint', 'dashboard', 'broadcast']
      return textApps.includes(i.contentType ?? '') && i.pixelPitchMm > 2.5
    },
    message: (i) => `Pixel pitch ${i.pixelPitchMm} mm is too coarse for “${i.contentType}” content.`,
    suggestion: () => 'Choose pixel pitch ≤ 1.9 mm for legible text at typical viewing distance.',
    recommendation: () => ({ field: 'pixelPitchMm', suggested: 1.9, confidence: 0.85 }),
    explanation: 'Text requires >= 8 px of vertical resolution per character. Coarser pitches force viewers back and reduce legibility.',
  },

  // R-02: Outdoor requires higher brightness
  {
    id: 'BRIGHTNESS_TOO_LOW_OUTDOOR',
    description: 'Outdoor installations require significantly higher brightness than indoor.',
    category: 'display', severity: 'critical',
    when: (i) => i.environment === 'outdoor' && (i.brightnessNits ?? 0) < BRIGHTNESS_DEFAULTS.outdoor.low,
    message: (i) => `Brightness ${i.brightnessNits ?? '?'} nits is insufficient for outdoor use (min ${BRIGHTNESS_DEFAULTS.outdoor.low} nits).`,
    suggestion: () => `Target ${BRIGHTNESS_DEFAULTS.outdoor.ideal} nits for outdoor daytime visibility.`,
    recommendation: () => ({ field: 'brightnessNits', suggested: BRIGHTNESS_DEFAULTS.outdoor.ideal, confidence: 0.95 }),
    explanation: 'Ambient sunlight on outdoor surfaces averages 10,000+ lux; displays under ~4,500 nits appear washed out.',
  },

  // R-03: Corporate boardrooms prioritise clarity
  {
    id: 'CORPORATE_NEEDS_FINE_PITCH',
    description: 'Corporate applications typically prioritise text clarity over cost.',
    category: 'display', severity: 'info',
    when: (i) => i.application === 'corporate' && i.pixelPitchMm > 2.5,
    message: (i) => `Corporate application with pitch ${i.pixelPitchMm} mm may sacrifice text clarity.`,
    suggestion: () => 'Use 1.5–1.9 mm pitch for boardroom-grade legibility.',
    recommendation: () => ({ field: 'pixelPitchMm', suggested: 1.9, confidence: 0.75 }),
    explanation: 'Corporate audiences read spreadsheets and slide decks at close range; investing in fine pitch reduces perceived pixel structure.',
  },

  // R-04: Stadium prioritises long-distance viewing (coarse pitch is fine)
  {
    id: 'STADIUM_PITCH_TOO_FINE',
    description: 'Stadium displays don’t need fine pixel pitch and may be over-specified.',
    category: 'display', severity: 'info',
    when: (i) => i.application === 'stadium' && i.pixelPitchMm < 5,
    message: (i) => `Stadium pitch ${i.pixelPitchMm} mm may be over-engineered.`,
    suggestion: () => 'Consider 6–8 mm pitch for stadium perimeter; the audience is far.',
    recommendation: () => ({ field: 'pixelPitchMm', suggested: 8, confidence: 0.7 }),
    explanation: 'Stadium viewing distances (20–80 m) mean fine pitch is imperceptible — the extra cost yields no visual benefit.',
  },

  // R-05: Cabinet layout wastes area
  {
    id: 'CABINET_INEFFICIENT_LAYOUT',
    description: 'Cabinet dimensions do not tile the screen efficiently (< 95% area used).',
    category: 'installation', severity: 'warning',
    when: (_i, ctx) => Boolean(ctx.cabinet && ctx.cabinet.efficiencyPercent < 95),
    message: (_i, ctx) => `Cabinet layout uses only ${ctx.cabinet!.efficiencyPercent}% of screen area.`,
    suggestion: (_i, ctx) => ctx.cabinet?.suggestedCabinet?.note ?? 'Adjust screen dimensions or cabinet size to an integer multiple.',
    explanation: 'Uneven cabinet tiling produces unused strips at the edges and complicates structural framing.',
  },

  // R-06: Viewing distance below recommendation
  {
    id: 'VIEWING_DISTANCE_BELOW_PITCH_RULE',
    description: 'Viewer will see pixel structure at this distance — violates the 3× pixel-pitch rule.',
    category: 'viewing', severity: 'warning',
    when: (_i, ctx) => Boolean(ctx.viewing && ctx.viewing.fitness === 'too_close'),
    message: (_i, ctx) => ctx.viewing!.explanation,
    suggestion: (_i, ctx) => `Increase viewing distance to at least ${ctx.viewing!.recommendedDistanceM} m or choose a finer pitch.`,
    explanation: 'The classic rule pitch×3 keeps pixels indistinguishable at normal visual acuity.',
  },

  // R-07: Viewing distance too far
  {
    id: 'VIEWING_TOO_FAR',
    description: 'Content will feel too small at this distance.',
    category: 'viewing', severity: 'info',
    when: (_i, ctx) => Boolean(ctx.viewing && ctx.viewing.fitness === 'too_far'),
    message: (_i, ctx) => ctx.viewing!.explanation,
    suggestion: () => 'Increase screen area or lower operating distance.',
    explanation: 'Beyond ~30× pitch, angular pixel size drops below visual acuity limits.',
  },

  // R-08: Aspect ratio non-standard
  {
    id: 'NON_STANDARD_ASPECT',
    description: 'Aspect ratio is not a broadcast standard — content must be authored to canvas.',
    category: 'content', severity: 'info',
    when: (_i, ctx) => !ctx.aspectRatio.isStandard,
    message: (_i, ctx) => `Aspect ratio ${ctx.aspectRatio.humanReadable} is non-standard.`,
    suggestion: () => 'Author content to the exact canvas or letterbox to a standard aspect.',
    explanation: 'Broadcast codecs, video players and CMS pipelines expect 16:9, 21:9 etc. Non-standard ratios cause scaling.',
  },

  // R-09: Power density exceeds recommended
  {
    id: 'POWER_DENSITY_HIGH',
    description: 'Power density is above typical HVAC and electrical planning limits.',
    category: 'power', severity: 'warning',
    when: (_i, ctx) => Boolean(ctx.power && ctx.power.wattsPerSqMMax > 900),
    message: (_i, ctx) => `Power density ${ctx.power!.wattsPerSqMMax} W/m² is high — verify HVAC and electrical capacity.`,
    suggestion: () => 'Coordinate with facility engineer for cooling and phase distribution.',
    explanation: 'Densities > 900 W/m² warrant active cooling and phase-balanced feeds.',
  },

  // R-10: Missing brightness for environment
  {
    id: 'BRIGHTNESS_UNSPECIFIED',
    description: 'Brightness not specified — recommend defaults for environment.',
    category: 'display', severity: 'info',
    when: (i) => i.brightnessNits === undefined && Boolean(i.environment),
    message: (i) => `No brightness specified. Recommended for ${i.environment}: ${BRIGHTNESS_DEFAULTS[i.environment as keyof typeof BRIGHTNESS_DEFAULTS]?.ideal ?? '?'} nits.`,
    recommendation: (i) => ({
      field: 'brightnessNits',
      suggested: BRIGHTNESS_DEFAULTS[i.environment as keyof typeof BRIGHTNESS_DEFAULTS]?.ideal ?? 800,
      confidence: 0.6,
    }),
    explanation: 'Brightness governs perceived contrast under ambient light.',
  },

  // R-11: Maintenance access unspecified for large displays
  {
    id: 'MAINTENANCE_ACCESS_MISSING',
    description: 'Large displays need explicit maintenance access strategy.',
    category: 'maintainability', severity: 'warning',
    when: (i, ctx) => (ctx.geometry.areaSqM > 10) && !(i.extras?.maintenanceAccess),
    message: () => 'Maintenance access strategy is unspecified for a screen larger than 10 m².',
    suggestion: () => 'Specify front, rear, or both access; drives cabinet family selection.',
    explanation: 'Rear access requires clearance behind the wall; front-access modules cost more but are essential in wall-flush installations.',
  },
]

/**
 * Recommendation helpers: derive a pixel-pitch bucket for an application.
 */
export function suggestedPitchForApplication(app?: string): { min: number; ideal: number; max: number } | null {
  if (!app) return null
  return (PITCH_SUGGESTIONS as Record<string, { min: number; ideal: number; max: number }>)[app] ?? null
}
