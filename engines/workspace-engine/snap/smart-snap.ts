/**
 * Sprint 7 Phase 7.2 — Smart Snap Engine.
 *
 * Pure, framework-agnostic snap calculator. Given a candidate position for a
 * moving object and the surrounding objects, it returns the "corrected" x/y
 * plus a list of visual guides the UI should draw.
 *
 * SNAP TARGETS (in priority order):
 *   • grid                  — legacy fallback (respects `settings.gridStep`)
 *   • object edges          — L/R/T/B alignment with any static neighbour
 *   • object centers        — X/Y centre alignment with any neighbour
 *   • equal spacing         — three-in-a-row detection along the drag axis
 *
 * The threshold is expressed in **screen pixels** so the feel is identical at
 * every zoom level. Callers pass viewport.scale to convert.
 *
 * Non-snap semantics:
 *   • `disable === true`     → returns the raw x/y (used when ALT is held).
 *   • `constrain === 'x'`    → y is forced back to the object's original y.
 *   • `constrain === 'y'`    → x is forced back to the object's original x.
 */

import type { SnapSettings } from '../types'
import { snapValue } from '../math'

/** A visual guide the UI draws while dragging. */
export interface SnapGuide {
  /** Orientation of the guide line in world space. */
  orientation: 'V' | 'H'
  /** World coordinate of the line (x for vertical, y for horizontal). */
  worldPos: number
  /** Line extent (world coord) — used to draw a tight guide instead of infinite. */
  from: number
  to: number
  /** Where the guide came from — used for colour + tooltip. */
  kind: 'edge' | 'center' | 'spacing' | 'grid'
}

export interface SnapCandidate {
  /** Axis-aligned bounding box of a static neighbour, in world mm. */
  minX: number; minY: number; maxX: number; maxY: number
  /** For grouping tie-breaks. */
  id?: string
}

export interface SmartSnapInput {
  /** Position (top-left, world mm) the user is trying to drop at. */
  x: number
  y: number
  /** Dimensions of the object being dragged. */
  width: number
  height: number
  /** Original (drag-start) position for axis-locking via SHIFT. */
  originX: number
  originY: number
  /** Static neighbours to snap against — MUST exclude the moving object. */
  neighbours: SnapCandidate[]
  /** Current zoom scalar (mm→px). Used to convert `thresholdPx` to world mm. */
  scale: number
  /** Screen-pixel threshold for edge/center snaps. Default 8. */
  thresholdPx?: number
  /** Legacy snap settings (grid step + enabled). */
  settings: SnapSettings
  /** When true, snap logic is bypassed entirely (ALT drag). */
  disable?: boolean
  /** SHIFT constrains the drag to a single axis. */
  constrain?: 'x' | 'y' | null
}

export interface SmartSnapResult {
  x: number
  y: number
  guides: SnapGuide[]
}

const CENTER_OF = (a: number, b: number) => (a + b) / 2

/**
 * Runs snap resolution and produces the guides list.
 *
 * Algorithm (per axis, independently):
 *  1. Build the list of anchor positions on the dragging object
 *     (left, centre, right for X; top, middle, bottom for Y).
 *  2. Build the list of anchor positions on every neighbour (same three).
 *  3. Compute the minimum |Δ| across all (drag-anchor, neighbour-anchor)
 *     pairs. If min |Δ| ≤ world-threshold → snap and record a guide.
 *  4. If none, try grid snap (if enabled). Grid guides are NOT drawn; they
 *     are represented as `kind:'grid'` but flag `to = from` so the overlay
 *     can decide to skip.
 *  5. Equal-spacing: with any two horizontally-aligned neighbours in a row,
 *     detect a "third slot" position and snap when the drag is close.
 */
export function computeSmartSnap(input: SmartSnapInput): SmartSnapResult {
  const { x, y, width, height, originX, originY, neighbours, scale, thresholdPx = 8, settings, disable, constrain } = input
  const guides: SnapGuide[] = []

  // Fast paths ────────────────────────────────────────────────────────────
  if (disable) {
    return applyConstrain({ x, y, guides: [] }, originX, originY, constrain)
  }

  const worldThreshold = Math.max(0.5, thresholdPx / Math.max(0.001, scale))

  // ─── Vertical snap (adjusts X) ────────────────────────────────────────
  const dragL  = x
  const dragCx = x + width / 2
  const dragR  = x + width

  let bestDx = Infinity
  let bestGuideV: SnapGuide | null = null

  for (const nb of neighbours) {
    const anchors: Array<[number, 'edge' | 'center']> = [
      [nb.minX,             'edge'],
      [CENTER_OF(nb.minX, nb.maxX), 'center'],
      [nb.maxX,             'edge'],
    ]
    for (const [nx, kind] of anchors) {
      for (const [dx, source] of [
        [nx - dragL,  'L'],
        [nx - dragCx, 'C'],
        [nx - dragR,  'R'],
      ] as const) {
        if (Math.abs(dx) < Math.abs(bestDx) && Math.abs(dx) <= worldThreshold) {
          bestDx = dx
          bestGuideV = {
            orientation: 'V',
            worldPos: nx,
            from: Math.min(nb.minY, y),
            to:   Math.max(nb.maxY, y + height),
            kind,
          }
          void source
        }
      }
    }
  }

  // ─── Horizontal snap (adjusts Y) ──────────────────────────────────────
  const dragT  = y
  const dragCy = y + height / 2
  const dragB  = y + height

  let bestDy = Infinity
  let bestGuideH: SnapGuide | null = null

  for (const nb of neighbours) {
    const anchors: Array<[number, 'edge' | 'center']> = [
      [nb.minY,             'edge'],
      [CENTER_OF(nb.minY, nb.maxY), 'center'],
      [nb.maxY,             'edge'],
    ]
    for (const [ny, kind] of anchors) {
      for (const [dy] of [
        [ny - dragT,  'T'],
        [ny - dragCy, 'C'],
        [ny - dragB,  'B'],
      ] as const) {
        if (Math.abs(dy) < Math.abs(bestDy) && Math.abs(dy) <= worldThreshold) {
          bestDy = dy
          bestGuideH = {
            orientation: 'H',
            worldPos: ny,
            from: Math.min(nb.minX, x),
            to:   Math.max(nb.maxX, x + width),
            kind,
          }
        }
      }
    }
  }

  // ─── Equal-spacing snap (X axis) ──────────────────────────────────────
  const spaceGuideV = detectEqualSpacing(neighbours, dragCx, dragCy, 'x', worldThreshold)
  if (spaceGuideV) {
    // Prefer edge/center match if we already have one within threshold.
    if (bestGuideV === null) {
      bestDx = spaceGuideV.snapDelta
      bestGuideV = spaceGuideV.guide
    }
  }
  const spaceGuideH = detectEqualSpacing(neighbours, dragCx, dragCy, 'y', worldThreshold)
  if (spaceGuideH) {
    if (bestGuideH === null) {
      bestDy = spaceGuideH.snapDelta
      bestGuideH = spaceGuideH.guide
    }
  }

  let snappedX = x
  let snappedY = y

  if (Number.isFinite(bestDx)) { snappedX += bestDx; if (bestGuideV) guides.push(bestGuideV) }
  if (Number.isFinite(bestDy)) { snappedY += bestDy; if (bestGuideH) guides.push(bestGuideH) }

  // ─── Grid snap fallback ───────────────────────────────────────────────
  if (!Number.isFinite(bestDx) && settings.enabled) {
    snappedX = snapValue(snappedX, settings.stepMm)
  }
  if (!Number.isFinite(bestDy) && settings.enabled) {
    snappedY = snapValue(snappedY, settings.stepMm)
  }

  return applyConstrain({ x: snappedX, y: snappedY, guides }, originX, originY, constrain)
}

/** Enforce SHIFT axis-lock on top of the snap result. */
function applyConstrain(
  res: SmartSnapResult,
  originX: number,
  originY: number,
  constrain: 'x' | 'y' | null | undefined,
): SmartSnapResult {
  if (constrain === 'x') return { ...res, y: originY }
  if (constrain === 'y') return { ...res, x: originX }
  return res
}

/**
 * Given a drag centre and two neighbours that already sit in a line, detect
 * whether adding the drag object at the "third-slot" position would create
 * three equally-spaced boxes on the requested axis.
 *
 * Currently the simplest and cheapest implementation: pick any two
 * neighbours, compute the equally-spaced offsets, and check the drag centre
 * against them.
 */
function detectEqualSpacing(
  neighbours: SnapCandidate[],
  dragCx: number,
  dragCy: number,
  axis: 'x' | 'y',
  worldThreshold: number,
): { snapDelta: number; guide: SnapGuide } | null {
  if (neighbours.length < 2) return null
  // Only consider neighbours that share the *other* axis roughly.
  const centerOnAxis = (n: SnapCandidate) => axis === 'x'
    ? CENTER_OF(n.minX, n.maxX)
    : CENTER_OF(n.minY, n.maxY)
  const centerOffAxis = (n: SnapCandidate) => axis === 'x'
    ? CENTER_OF(n.minY, n.maxY)
    : CENTER_OF(n.minX, n.maxX)
  const dragOff = axis === 'x' ? dragCy : dragCx

  const sameRow = neighbours.filter((n) => Math.abs(centerOffAxis(n) - dragOff) <= worldThreshold * 8)
  if (sameRow.length < 2) return null
  sameRow.sort((a, b) => centerOnAxis(a) - centerOnAxis(b))

  const [a, b] = [sameRow[0], sameRow[1]]
  const ca = centerOnAxis(a)
  const cb = centerOnAxis(b)
  const gap = cb - ca
  if (gap <= 0) return null

  // Candidate "third slots".
  const before = ca - gap
  const after  = cb + gap
  const dragOn = axis === 'x' ? dragCx : dragCy

  const dBefore = before - dragOn
  const dAfter  = after  - dragOn
  const [pick, delta] = Math.abs(dBefore) < Math.abs(dAfter) ? [before, dBefore] : [after, dAfter]

  if (Math.abs(delta) > worldThreshold) return null

  const guide: SnapGuide = axis === 'x'
    ? {
        orientation: 'V', worldPos: pick, kind: 'spacing',
        from: Math.min(a.minY, b.minY),
        to:   Math.max(a.maxY, b.maxY),
      }
    : {
        orientation: 'H', worldPos: pick, kind: 'spacing',
        from: Math.min(a.minX, b.minX),
        to:   Math.max(a.maxX, b.maxX),
      }
  return { snapDelta: delta, guide }
}
