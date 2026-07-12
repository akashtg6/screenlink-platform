/**
 * Sprint 6B — Workspace Engine · migrations
 *
 * Every persisted workspace carries a `schemaVersion`. On load we run
 * `migrate(raw)` which walks the version chain to bring the payload up to
 * the current schema. Never discard fields silently.
 */

import { clampZoom } from '../math'
import { normaliseZIndex } from '../geometry'
import { newLayerId, newObjectId, newWorkspaceId } from '../utils'
import { emptyWorkspace } from '../serialization'
import type { Layer, Viewport, Workspace, WorkspaceObject, WorkspaceSettings } from '../types'
import { WORKSPACE_SCHEMA_VERSION } from '../types'

/**
 * Load-time entry point. Accepts:
 *  - `undefined` → fresh empty workspace
 *  - Sprint 6A shape (v1: `{ version, nodes, layers, viewport, updatedAt }`)
 *  - Sprint 6B shape (v2: full hierarchical Workspace)
 */
export function migrateWorkspace(
  raw: unknown,
  ctx: { projectId: string; createdBy: string | null },
): Workspace {
  if (!raw || typeof raw !== 'object') return emptyWorkspace(ctx.projectId, ctx.createdBy)
  const r = raw as Record<string, unknown>

  // Detect version. Sprint 6A used `version: 1`, Sprint 6B uses `schemaVersion: 2`.
  const declaredVersion = (r.schemaVersion as number | undefined) ?? (r.version as number | undefined) ?? 1

  let out: Workspace
  if (declaredVersion === WORKSPACE_SCHEMA_VERSION) {
    out = hydrateV2(r, ctx)
  } else if (declaredVersion === 1) {
    out = migrateV1toV2(r, ctx)
  } else {
    // Unknown / newer version — refuse to silently downgrade. Fall back to empty.
    console.warn(`[workspace] Unknown schemaVersion=${declaredVersion}; loading empty workspace.`)
    out = emptyWorkspace(ctx.projectId, ctx.createdBy)
  }

  return {
    ...out,
    objects: normaliseZIndex(out.objects),
    viewport: { ...out.viewport, scale: clampZoom(out.viewport.scale) },
  }
}

/* -------------------------------------------------------------------------- */
/* v1 (Sprint 6A) → v2 (Sprint 6B)                                             */
/* -------------------------------------------------------------------------- */

function migrateV1toV2(r: Record<string, unknown>, ctx: { projectId: string; createdBy: string | null }): Workspace {
  const base = emptyWorkspace(ctx.projectId, ctx.createdBy)

  const layers = Array.isArray(r.layers) && r.layers.length > 0
    ? (r.layers as Partial<Layer>[]).map((l, i): Layer => ({
        id: typeof l.id === 'string' ? l.id : newLayerId(),
        name: typeof l.name === 'string' && l.name ? l.name : `Layer ${i + 1}`,
        visible: l.visible !== false,
        locked: l.locked === true,
        order: typeof l.order === 'number' ? l.order : i,
      }))
    : base.layers

  const layerIds = new Set(layers.map((l) => l.id))
  const fallbackLayerId = layers[0].id

  const objects = Array.isArray(r.nodes)
    ? (r.nodes as Record<string, unknown>[]).map((n): WorkspaceObject => {
        const meta = (n.meta as { manufacturer?: string; pixelPitchMm?: number; resolution?: string; accent?: string } | undefined) ?? {}
        const kind = String(n.category ?? 'placeholder')
        const resolution = parseResolution(meta.resolution)

        const baseObj = {
          id: typeof n.id === 'string' ? n.id : newObjectId(),
          name: String(n.name ?? 'Item'),
          x: Number(n.x) || 0,
          y: Number(n.y) || 0,
          width: Math.max(1, Number(n.width) || 100),
          height: Math.max(1, Number(n.height) || 100),
          rotation: Number(n.rotation) || 0,
          layerId: typeof n.layerId === 'string' && layerIds.has(n.layerId) ? n.layerId : fallbackLayerId,
          locked: n.locked === true,
          visible: n.visible !== false,
          zIndex: Number(n.zIndex) || 0,
          groupId: typeof n.groupId === 'string' ? n.groupId : null,
          libraryItemId: typeof n.catalogId === 'string' ? n.catalogId : undefined,
        }

        if (kind === 'led') {
          return {
            ...baseObj, kind: 'cabinet',
            manufacturer: meta.manufacturer ?? 'Unknown',
            pixelPitchMm: meta.pixelPitchMm ?? 0,
            resolution: resolution ?? { w: 0, h: 0 },
            accent: (meta.accent as 'red') ?? 'red',
          }
        }
        if (kind === 'lcd') {
          return {
            ...baseObj, kind: 'lcd',
            manufacturer: meta.manufacturer ?? 'Unknown',
            resolution: resolution ?? { w: 0, h: 0 },
            accent: (meta.accent as 'blue') ?? 'blue',
          }
        }
        return {
          ...baseObj, kind: 'placeholder',
          manufacturer: meta.manufacturer,
          accent: (meta.accent as 'slate') ?? 'slate',
        }
      })
    : []

  const v = r.viewport as Partial<Viewport> | undefined
  const viewport: Viewport = { x: v?.x ?? 0, y: v?.y ?? 0, scale: v?.scale ?? 1 }

  const settings: WorkspaceSettings = base.settings

  return {
    ...base,
    id: typeof r.id === 'string' ? r.id : newWorkspaceId(),
    layers,
    objects,
    viewport,
    settings,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : base.updatedAt,
  }
}

function parseResolution(s: string | undefined): { w: number; h: number } | undefined {
  if (!s) return undefined
  const m = /^(\d+)\s*[x×]\s*(\d+)$/.exec(s.trim())
  return m ? { w: Number(m[1]), h: Number(m[2]) } : undefined
}

/* -------------------------------------------------------------------------- */
/* v2 hydrate (light sanitisation)                                             */
/* -------------------------------------------------------------------------- */

function hydrateV2(r: Record<string, unknown>, ctx: { projectId: string; createdBy: string | null }): Workspace {
  const base = emptyWorkspace(ctx.projectId, ctx.createdBy)
  return {
    id: typeof r.id === 'string' ? r.id : base.id,
    projectId: typeof r.projectId === 'string' ? r.projectId : ctx.projectId,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : base.createdAt,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : base.updatedAt,
    createdBy: (r.createdBy as string | null | undefined) ?? ctx.createdBy,
    metadata: (r.metadata as Workspace['metadata']) ?? {},
    canvas: (r.canvas as Workspace['canvas']) ?? base.canvas,
    layers: (Array.isArray(r.layers) ? r.layers : base.layers) as Layer[],
    objects: (Array.isArray(r.objects) ? r.objects : []) as WorkspaceObject[],
    viewport: (r.viewport as Viewport) ?? base.viewport,
    settings: (r.settings as WorkspaceSettings) ?? base.settings,
  }
}
