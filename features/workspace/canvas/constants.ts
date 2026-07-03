/**
 * Sprint 6A — Canvas constants.
 *
 * Coordinate system: 1 world unit == 1 millimetre.
 * Stage displays world units multiplied by the current viewport scale.
 */

/** Grid step (world mm). Fine grid is drawn every `GRID_STEP`; every 5th line is major. */
export const GRID_STEP = 100 // 10 cm
export const GRID_MAJOR_EVERY = 5 // 50 cm

/** Snap resolution (world mm). */
export const SNAP_STEP = 10 // 1 cm — feels precise but not fiddly.

/** Zoom bounds. */
export const ZOOM_MIN = 0.1 // 10%
export const ZOOM_MAX = 5.0 // 500%
/** Mouse-wheel zoom rate. */
export const ZOOM_STEP = 1.08

/** Nudge distances (world mm). */
export const NUDGE_SMALL = 10
export const NUDGE_LARGE = 100

/** Palette (tailwind semantic tokens can't reach Konva; use hex). */
export const CANVAS_BG = '#0b0f16'
export const GRID_MINOR = '#1a2130'
export const GRID_MAJOR = '#243146'
export const SELECTION_STROKE = '#38bdf8' // sky-400
export const SELECTION_FILL = 'rgba(56,189,248,0.06)'
export const MARQUEE_STROKE = '#0ea5e9'
export const MARQUEE_FILL = 'rgba(14,165,233,0.10)'

/** Category accent → hex map (used on the canvas). */
export const ACCENT_HEX: Record<'red' | 'blue' | 'emerald' | 'amber' | 'violet' | 'slate', {
  bg: string; border: string; text: string
}> = {
  red:     { bg: '#3b1a1e', border: '#f87171', text: '#fecaca' },
  blue:    { bg: '#0f2540', border: '#60a5fa', text: '#dbeafe' },
  emerald: { bg: '#0e2b1f', border: '#34d399', text: '#d1fae5' },
  amber:   { bg: '#3a2914', border: '#fbbf24', text: '#fef3c7' },
  violet:  { bg: '#251a3a', border: '#a78bfa', text: '#ede9fe' },
  slate:   { bg: '#111826', border: '#94a3b8', text: '#e2e8f0' },
}

/** Autosave interval in milliseconds. */
export const AUTOSAVE_INTERVAL_MS = 15_000

/** Undo history depth. */
export const HISTORY_LIMIT = 50

/** Minimap dimensions (screen pixels). */
export const MINIMAP_WIDTH = 200
export const MINIMAP_HEIGHT = 140

/** Default layer name for the primary layer. */
export const DEFAULT_LAYER_NAME = 'Layout'
