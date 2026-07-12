/**
 * Sprint 6B — Workspace Engine · geometry
 *
 * Bounding-box math, alignment, distribution, z-order helpers.
 * Consumers include the Snap and Collision modules and the Command factories.
 *
 * Every helper is generic over an object shape that only needs the position/
 * size/rotation base fields, so legacy Sprint 6A `WorkspaceNode` and the new
 * `WorkspaceObject` union can both be passed in without casts.
 */

import { degToRad } from '../math'
import type { Aabb, Point, WorkspaceObject } from '../types'

/** Minimum shape needed for spatial math. */
export interface SpatialObject {
  id: string
  x: number; y: number
  width: number; height: number
  rotation: number
  layerId: string
  zIndex: number
  visible?: boolean
  groupId?: string | null
}

/** Rotated-rectangle world-space AABB. Rotation is about the object centre. */
export function rotatedAabb(o: Pick<SpatialObject, 'x' | 'y' | 'width' | 'height' | 'rotation'>): Aabb {
  const cx = o.x + o.width / 2
  const cy = o.y + o.height / 2
  const rad = degToRad(o.rotation)
  const c = Math.cos(rad), s = Math.sin(rad)
  const hw = o.width / 2, hh = o.height / 2
  const corners = [
    [-hw, -hh], [ hw, -hh], [ hw,  hh], [-hw,  hh],
  ].map(([dx, dy]) => ({
    x: cx + dx * c - dy * s,
    y: cy + dx * s + dy * c,
  }))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function objectBounds<T extends SpatialObject>(o: T): Aabb { return rotatedAabb(o) }

export function unionBounds<T extends SpatialObject>(objects: T[]): Aabb | null {
  if (objects.length === 0) return null
  let b: Aabb | null = null
  for (const o of objects) {
    const ab = objectBounds(o)
    if (!b) { b = { ...ab }; continue }
    b.minX = Math.min(b.minX, ab.minX)
    b.minY = Math.min(b.minY, ab.minY)
    b.maxX = Math.max(b.maxX, ab.maxX)
    b.maxY = Math.max(b.maxY, ab.maxY)
  }
  return b
}

export function centreOf(a: Aabb): Point { return { x: (a.minX + a.maxX) / 2, y: (a.minY + a.maxY) / 2 } }
export function widthOf(a: Aabb): number { return a.maxX - a.minX }
export function heightOf(a: Aabb): number { return a.maxY - a.minY }

/* -------------------------------------------------------------------------- */
/* Alignment                                                                   */
/* -------------------------------------------------------------------------- */

export type AlignEdge = 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'

export function alignObjects<T extends SpatialObject>(objects: T[], edge: AlignEdge): T[] {
  if (objects.length < 2) return objects
  const bounds = unionBounds(objects); if (!bounds) return objects
  return objects.map((o): T => {
    const b = objectBounds(o)
    const w = b.maxX - b.minX, h = b.maxY - b.minY
    let dx = 0, dy = 0
    switch (edge) {
      case 'left':    dx = bounds.minX - b.minX; break
      case 'right':   dx = bounds.maxX - b.maxX; break
      case 'top':     dy = bounds.minY - b.minY; break
      case 'bottom':  dy = bounds.maxY - b.maxY; break
      case 'centerH': dx = (bounds.minX + (bounds.maxX - bounds.minX) / 2) - (b.minX + w / 2); break
      case 'centerV': dy = (bounds.minY + (bounds.maxY - bounds.minY) / 2) - (b.minY + h / 2); break
    }
    return { ...o, x: o.x + dx, y: o.y + dy }
  })
}

/* -------------------------------------------------------------------------- */
/* Distribution                                                                */
/* -------------------------------------------------------------------------- */

export type DistributeAxis = 'horizontal' | 'vertical'

export function distributeObjects<T extends SpatialObject>(objects: T[], axis: DistributeAxis): T[] {
  if (objects.length < 3) return objects
  const sorted = [...objects].sort((a, b) => {
    const ab = objectBounds(a), bb = objectBounds(b)
    return axis === 'horizontal' ? ab.minX - bb.minX : ab.minY - bb.minY
  })
  const first = objectBounds(sorted[0])
  const last  = objectBounds(sorted[sorted.length - 1])
  const totalSpan = axis === 'horizontal' ? last.maxX - first.minX : last.maxY - first.minY
  const sizesSum = sorted.reduce((acc, o) => {
    const b = objectBounds(o)
    return acc + (axis === 'horizontal' ? (b.maxX - b.minX) : (b.maxY - b.minY))
  }, 0)
  const gap = (totalSpan - sizesSum) / (sorted.length - 1)
  const anchor = axis === 'horizontal' ? first.minX : first.minY

  const moved = new Map<string, { dx: number; dy: number }>()
  let cursor = anchor
  for (const o of sorted) {
    const b = objectBounds(o)
    const size = axis === 'horizontal' ? (b.maxX - b.minX) : (b.maxY - b.minY)
    const currentMin = axis === 'horizontal' ? b.minX : b.minY
    const delta = cursor - currentMin
    if (axis === 'horizontal') moved.set(o.id, { dx: delta, dy: 0 })
    else                        moved.set(o.id, { dx: 0, dy: delta })
    cursor = cursor + size + gap
  }

  return objects.map((o): T => {
    const m = moved.get(o.id)
    return m ? { ...o, x: o.x + m.dx, y: o.y + m.dy } : o
  })
}

/* -------------------------------------------------------------------------- */
/* Z-order                                                                     */
/* -------------------------------------------------------------------------- */

export function normaliseZIndex<T extends SpatialObject>(objects: T[]): T[] {
  const byLayer: Record<string, T[]> = {}
  for (const o of objects) (byLayer[o.layerId] ??= []).push(o)
  const idToZ = new Map<string, number>()
  for (const list of Object.values(byLayer)) {
    list.sort((a, b) => a.zIndex - b.zIndex)
    list.forEach((o, i) => idToZ.set(o.id, i))
  }
  return objects.map((o): T => ({ ...o, zIndex: idToZ.get(o.id) ?? o.zIndex }))
}

export function bringForward<T extends SpatialObject>(objects: T[], ids: Set<string>): T[] {
  return normaliseZIndex(objects).map((o): T => ids.has(o.id) ? { ...o, zIndex: o.zIndex + 1.5 } : o)
}

export function sendBackward<T extends SpatialObject>(objects: T[], ids: Set<string>): T[] {
  return normaliseZIndex(objects).map((o): T => ids.has(o.id) ? { ...o, zIndex: o.zIndex - 1.5 } : o)
}

export function bringToFront<T extends SpatialObject>(objects: T[], ids: Set<string>): T[] {
  const max = objects.reduce((m, o) => o.zIndex > m ? o.zIndex : m, 0)
  return objects.map((o): T => ids.has(o.id) ? { ...o, zIndex: max + 1 } : o)
}

export function sendToBack<T extends SpatialObject>(objects: T[], ids: Set<string>): T[] {
  const min = objects.reduce((m, o) => o.zIndex < m ? o.zIndex : m, 0)
  return objects.map((o): T => ids.has(o.id) ? { ...o, zIndex: min - 1 } : o)
}

/** Type-checked convenience for consumers who *do* have full `WorkspaceObject`. */
export type { WorkspaceObject }
