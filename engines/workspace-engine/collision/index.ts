/**
 * Sprint 6B — Workspace Engine · collision & hit-test
 */

import { objectBounds } from '../geometry'
import type { SpatialObject } from '../geometry'
import type { Aabb, Point } from '../types'

/** Does an object's rotated AABB intersect the given rectangle? */
export function intersectsRect<T extends SpatialObject>(object: T, rect: Aabb): boolean {
  const b = objectBounds(object)
  return !(b.maxX < rect.minX || b.minX > rect.maxX || b.maxY < rect.minY || b.minY > rect.maxY)
}

export function containsPoint<T extends SpatialObject>(object: T, p: Point): boolean {
  const b = objectBounds(object)
  return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY
}

/** Topmost object at world point (highest zIndex first). */
export function objectAt<T extends SpatialObject>(objects: T[], p: Point): T | undefined {
  return [...objects]
    .filter((o) => o.visible !== false && containsPoint(o, p))
    .sort((a, b) => b.zIndex - a.zIndex)[0]
}
