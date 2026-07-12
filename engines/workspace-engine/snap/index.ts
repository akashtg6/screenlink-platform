/**
 * Sprint 6B — Workspace Engine · snap
 */

import { snapValue as snapValueMath } from '../math'
import type { SnapSettings, WorkspaceObject } from '../types'

export function snapObjectPosition<T extends Pick<WorkspaceObject, 'x' | 'y'>>(
  o: T,
  settings: SnapSettings,
): T {
  if (!settings.enabled) return o
  return { ...o, x: snapValueMath(o.x, settings.stepMm), y: snapValueMath(o.y, settings.stepMm) }
}

export function snapDelta(delta: number, settings: SnapSettings): number {
  return settings.enabled ? snapValueMath(delta, settings.stepMm) : delta
}

export { snapValueMath as snapValue }
