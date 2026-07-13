/**
 * Sprint 7 — Pure viewport math helpers.
 *
 * Everything here is deterministic, side-effect free, and unit-tested. Callers
 * (Zustand store, Rulers, ZoomIndicator) treat it as a small utility library
 * so the same math powers screens, tests and future Playwright checks.
 *
 * Coordinate system reminder:
 *   • World units == millimetres.
 *   • Viewport `{x, y}` is the *offset of the world origin* on screen.
 *   • Viewport `scale` maps world units to CSS pixels (1 => 1mm=1px).
 */

import type { WorkspaceNode, WorkspaceViewport } from './types'
import { clampZoom, unionBounds } from './engine'

/** Convert a screen-space point to a world-space point. */
export function screenToWorld(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number },
  viewport: WorkspaceViewport,
): { x: number; y: number } {
  const px = clientX - rect.left
  const py = clientY - rect.top
  return {
    x: (px - viewport.x) / viewport.scale,
    y: (py - viewport.y) / viewport.scale,
  }
}

/** Convert a world-space point to canvas-space (relative to the container). */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: WorkspaceViewport,
): { x: number; y: number } {
  return {
    x: worldX * viewport.scale + viewport.x,
    y: worldY * viewport.scale + viewport.y,
  }
}

/** Bounds structure used across the engine. */
export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

/**
 * Compute the viewport that fits `bounds` inside the given container with
 * `padding` (screen pixels) on every side. Returns `null` when the bounds are
 * degenerate (should render as no-op).
 */
export function fitBoundsViewport(
  bounds: Bounds,
  containerWidth: number,
  containerHeight: number,
  padding = 80,
): WorkspaceViewport | null {
  const w = bounds.maxX - bounds.minX
  const h = bounds.maxY - bounds.minY
  if (w <= 0 || h <= 0) return null
  if (containerWidth <= padding * 2 || containerHeight <= padding * 2) return null

  const scale = clampZoom(Math.min(
    (containerWidth  - padding * 2) / w,
    (containerHeight - padding * 2) / h,
  ))
  // Centre the bounds inside the container after scaling.
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  const x = containerWidth  / 2 - cx * scale
  const y = containerHeight / 2 - cy * scale
  return { x, y, scale }
}

/**
 * Compute a viewport that frames the given nodes. Returns `null` if the input
 * is empty or the bounds collapse.
 */
export function fitNodesViewport(
  nodes: WorkspaceNode[],
  containerWidth: number,
  containerHeight: number,
  padding = 80,
): WorkspaceViewport | null {
  if (nodes.length === 0) return null
  const b = unionBounds(nodes)
  if (!b) return null
  return fitBoundsViewport(b, containerWidth, containerHeight, padding)
}

/**
 * Choose a "nice" grid step for the current zoom.
 *
 * Uses a 1-2-5 series scaled by powers of ten so the on-screen step stays
 * inside `[targetPx / 2.5, targetPx * 2.5]`. The result is always in world
 * millimetres, guaranteed positive.
 */
export function pickGridStep(scale: number, baseStep = 100, targetPx = 50): number {
  if (!Number.isFinite(scale) || scale <= 0) return baseStep
  const idealMm = targetPx / scale
  // Sequence: baseStep × {1, 2, 5, 10, 20, 50, 100, 200, 500, ...} — and inverse.
  const series = [1, 2, 5]
  let bestStep = baseStep
  let bestErr = Infinity
  for (let power = -3; power <= 4; power++) {
    for (const s of series) {
      const step = baseStep * s * Math.pow(10, power)
      const err = Math.abs(Math.log(step / idealMm))
      if (err < bestErr) { bestErr = err; bestStep = step }
    }
  }
  return bestStep
}

/**
 * Grid opacity fade — dims the grid as zoom increases so it never crowds
 * detail work. Returns a value in [0, 1].
 */
export function pickGridOpacity(scale: number): number {
  if (scale <= 0.25) return 0.55
  if (scale <= 0.5) return 0.75
  if (scale <= 2) return 1
  if (scale <= 3) return 0.85
  return 0.65
}

/** Format a zoom scalar as a percentage string, e.g. `100%`. */
export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`
}

/** Ruler tick descriptor. */
export interface RulerTick { positionPx: number; worldMm: number; major: boolean }

/**
 * Generate ruler ticks along a single axis for the current viewport.
 * `axis` = 'x' → uses viewport.x; `axis` = 'y' → uses viewport.y.
 */
export function generateRulerTicks(
  axis: 'x' | 'y',
  viewport: WorkspaceViewport,
  lengthPx: number,
  step?: number,
): RulerTick[] {
  const s = step ?? pickGridStep(viewport.scale)
  const offset = axis === 'x' ? viewport.x : viewport.y
  // First tick in world units that would appear on screen at pixel >= 0.
  const worldStart = (-offset) / viewport.scale
  const worldEnd   = (lengthPx - offset) / viewport.scale
  const first = Math.floor(worldStart / s) * s
  const ticks: RulerTick[] = []
  for (let w = first; w <= worldEnd; w += s) {
    const positionPx = w * viewport.scale + offset
    if (positionPx < -2 || positionPx > lengthPx + 2) continue
    // Every 5th tick is major.
    const major = Math.round(w / s) % 5 === 0
    ticks.push({ positionPx, worldMm: w, major })
    // Cap at 2 000 ticks — prevents runaway loops with weird inputs.
    if (ticks.length > 2000) break
  }
  return ticks
}

/**
 * Given a marquee rectangle in *screen pixels*, decide whether it's a
 * meaningful drag (vs. an accidental click). Threshold expressed in screen
 * pixels so it behaves the same at every zoom.
 */
export function isMeaningfulMarquee(widthPx: number, heightPx: number, thresholdPx = 4): boolean {
  return Math.abs(widthPx) > thresholdPx || Math.abs(heightPx) > thresholdPx
}
