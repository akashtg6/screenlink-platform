/** Industry-standard defaults used by Power / Weight / Viewing engines. */
export const POWER_DEFAULTS = Object.freeze({
  /** Max power draw at full white 100% brightness (W/m²) */
  maxWattsPerSqM: {
    led: 800,
    lcd: 200,
    transparent: 350,
    projection: 100,
  },
  /** Typical average power during normal content (fraction of max) */
  typicalFactor: {
    powerpoint: 0.30,
    dashboard: 0.35,
    video: 0.50,
    broadcast: 0.55,
    advertising: 0.55,
    gaming: 0.60,
    control_room: 0.40,
    mixed: 0.45,
  } as Record<string, number>,
  defaultTypicalFactor: 0.40,
})

export const WEIGHT_DEFAULTS = Object.freeze({
  /** Mass per m² by display family (kg/m², cabinet + module) */
  massPerSqM: {
    led: 30,
    lcd: 20,
    transparent: 12,
    projection: 5,
  },
})

export const VIEWING_DEFAULTS = Object.freeze({
  /** “Pitch × factor” rules-of-thumb (metres) */
  minFactor: 1,
  recommendedFactor: 3,
  maxFactor: 30,
})

/** Recommended brightness (nits) by environment. */
export const BRIGHTNESS_DEFAULTS = Object.freeze({
  indoor: { low: 400, ideal: 800, high: 1200 },
  semi_outdoor: { low: 1500, ideal: 2500, high: 3500 },
  outdoor: { low: 4500, ideal: 6000, high: 7500 },
})

/** Pixel-pitch suggestion buckets by application. */
export const PITCH_SUGGESTIONS = Object.freeze({
  control_room: { min: 0.9, ideal: 1.5, max: 1.9 },
  broadcast: { min: 1.2, ideal: 1.9, max: 2.5 },
  corporate: { min: 1.5, ideal: 1.9, max: 2.6 },
  retail: { min: 1.9, ideal: 2.5, max: 3.9 },
  hospitality: { min: 1.9, ideal: 2.5, max: 3.9 },
  education: { min: 1.9, ideal: 2.5, max: 3.9 },
  transport: { min: 2.5, ideal: 3.9, max: 6 },
  stadium: { min: 6, ideal: 8, max: 16 },
  other: { min: 1.5, ideal: 2.5, max: 4 },
})
