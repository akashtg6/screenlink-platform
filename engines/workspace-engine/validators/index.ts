/**
 * Sprint 6B — Workspace Engine · validators
 *
 * Ensures workspace integrity: every object references an existing layer,
 * no duplicate ids, viewport scale within range, etc. Diagnostic-style output
 * so future rules-engine can reuse the same reporting shape.
 */

import { ZOOM_MAX, ZOOM_MIN } from '../math'
import type { Workspace } from '../types'

export interface ValidationIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
  path?: string
}

export function validateWorkspace(w: Workspace): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!w.id) issues.push({ code: 'workspace.missing-id', severity: 'error', message: 'Workspace has no id' })
  if (!w.projectId) issues.push({ code: 'workspace.missing-projectId', severity: 'error', message: 'Workspace has no projectId' })
  if (typeof w.schemaVersion !== 'number') issues.push({ code: 'workspace.bad-version', severity: 'error', message: 'schemaVersion missing' })

  if (!w.layers || w.layers.length === 0) issues.push({ code: 'workspace.no-layers', severity: 'error', message: 'At least one layer required' })

  const layerIds = new Set(w.layers.map((l) => l.id))
  const objectIds = new Set<string>()
  for (const o of w.objects) {
    if (objectIds.has(o.id)) issues.push({ code: 'objects.duplicate-id', severity: 'error', message: `Duplicate object id: ${o.id}` })
    objectIds.add(o.id)
    if (!layerIds.has(o.layerId)) issues.push({ code: 'objects.orphan-layer', severity: 'warning', message: `Object ${o.id} references missing layer ${o.layerId}` })
    if (o.width <= 0 || o.height <= 0) issues.push({ code: 'objects.zero-size', severity: 'warning', message: `Object ${o.id} has non-positive size` })
  }

  if (w.viewport.scale < ZOOM_MIN || w.viewport.scale > ZOOM_MAX) {
    issues.push({ code: 'viewport.out-of-range', severity: 'warning', message: `Viewport scale ${w.viewport.scale} outside [${ZOOM_MIN}, ${ZOOM_MAX}]` })
  }

  return issues
}

export function isValidWorkspace(w: Workspace): boolean {
  return validateWorkspace(w).every((i) => i.severity !== 'error')
}
