/**
 * Sprint 6B — Workspace Engine · math
 *
 * Pure scalar/vector helpers. No React, no browser APIs.
 */

import { Point } from '../types'

export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 5.0
export const ZOOM_STEP = 1.08

export function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}

export function clampZoom(scale: number): number {
  return clamp(scale, ZOOM_MIN, ZOOM_MAX)
}

export function snapValue(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export function snapPoint(p: Point, step: number): Point {
  return { x: snapValue(p.x, step), y: snapValue(p.y, step) }
}

export function degToRad(deg: number): number { return (deg * Math.PI) / 180 }
export function radToDeg(rad: number): number { return (rad * 180) / Math.PI }

export function addPoint(a: Point, b: Point): Point { return { x: a.x + b.x, y: a.y + b.y } }
export function subPoint(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y } }

/** Rotate `p` about `origin` by `deg` degrees. */
export function rotateAbout(p: Point, origin: Point, deg: number): Point {
  const rad = degToRad(deg)
  const c = Math.cos(rad), s = Math.sin(rad)
  const dx = p.x - origin.x
  const dy = p.y - origin.y
  return { x: origin.x + dx * c - dy * s, y: origin.y + dx * s + dy * c }
}
