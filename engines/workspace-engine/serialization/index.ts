/**
 * Sprint 6B — Workspace Engine · serialization
 *
 * `Workspace` ↔ JSON. Never persist ephemeral state (selection, hover, history).
 */

import { normaliseZIndex } from '../geometry'
import type { Workspace, Layer, WorkspaceObject } from '../types'
import { WORKSPACE_SCHEMA_VERSION } from '../types'

/** Deep-freeze-safe serialisation. */
export function serializeWorkspace(w: Workspace): Workspace {
  return {
    id: w.id,
    projectId: w.projectId,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    createdAt: w.createdAt,
    updatedAt: new Date().toISOString(),
    createdBy: w.createdBy,
    metadata: w.metadata,
    canvas: w.canvas,
    layers: w.layers.map((l) => ({ ...l })),
    objects: normaliseZIndex(w.objects).map((o) => ({ ...o })),
    viewport: { ...w.viewport },
    settings: w.settings,
  }
}

/** Structural equality for autosave short-circuit. */
export function workspacesEqual(a: Workspace, b: Workspace): boolean {
  return JSON.stringify(stripVolatile(a)) === JSON.stringify(stripVolatile(b))
}

function stripVolatile(w: Workspace) {
  // updatedAt intentionally excluded from the equality check.
  const { updatedAt: _updatedAt, ...rest } = w
  return rest
}

export function emptyWorkspace(projectId: string, createdBy: string | null): Workspace {
  const now = new Date().toISOString()
  const primary: Layer = {
    id: 'l_primary',
    name: 'Layout',
    visible: true,
    locked: false,
    order: 0,
  }
  return {
    id: `w_${projectId}`,
    projectId,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    createdBy,
    metadata: {},
    canvas: { background: { color: '#0b0f16' }, units: 'mm' },
    layers: [primary],
    objects: [] as WorkspaceObject[],
    viewport: { x: 0, y: 0, scale: 1 },
    settings: {
      grid: { visible: true, stepMm: 100, majorEvery: 5 },
      snap: { enabled: true, stepMm: 10 },
      autoSaveIntervalMs: 15_000,
    },
  }
}
