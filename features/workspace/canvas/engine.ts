/**
 * Sprint 6B — legacy re-export shim.
 *
 * Sprint 6A imported these symbols directly from this module; the actual
 * pure-logic implementations now live in `@/engines/workspace-engine`. This
 * shim adapts between:
 *   - runtime shape used by the Sprint 6A UI (`WorkspaceNode` w/ `meta` blob), and
 *   - engine helpers that are generic over spatial props.
 *
 * Slated for removal in Sprint 6C, once the UI has migrated to the
 * `WorkspaceObject` discriminated union.
 */

export {
  // math
  snapValue, snapPoint, clampZoom, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP,
  // geometry (generic)
  rotatedAabb, unionBounds, alignObjects as alignNodes, distributeObjects as distributeNodes,
  normaliseZIndex, bringForward, sendBackward, bringToFront, sendToBack,
  // collision (generic)
  intersectsRect,
  // utils (generic)
  newObjectId as newNodeId, newLayerId, newGroupId,
  duplicateObjects as duplicateNodes, groupObjects as groupNodes,
  ungroupObjects as ungroupNodes, expandGroupSelection,
} from '@/engines/workspace-engine'
export type { AlignEdge, DistributeAxis } from '@/engines/workspace-engine'

import { newLayerId as _newLayerId } from '@/engines/workspace-engine'
import type { CabinetCatalogItem } from './types'
import type { WorkspaceLayer, WorkspaceNode, WorkspaceState, WorkspaceViewport } from './types'
import { WORKSPACE_SCHEMA_VERSION } from './types'

/* -------------------------------------------------------------------------- */
/* Hydration / serialisation (Sprint 6A shape stays canonical at runtime)      */
/* -------------------------------------------------------------------------- */

export function emptyWorkspaceState(): WorkspaceState {
  const primary: WorkspaceLayer = { id: _newLayerId(), name: 'Layout', visible: true, locked: false, order: 0 }
  return {
    version: WORKSPACE_SCHEMA_VERSION,
    nodes: [],
    layers: [primary],
    viewport: { x: 0, y: 0, scale: 1 },
    updatedAt: new Date(0).toISOString(),
  }
}

export function hydrateWorkspaceState(raw: unknown): WorkspaceState {
  const seed = emptyWorkspaceState()
  if (!raw || typeof raw !== 'object') return seed
  const r = raw as Record<string, unknown>

  // Sprint 6B v2 shape is stored under `objects` + `schemaVersion=2`; when we
  // encounter it we lift it back to the Sprint 6A wire shape. The persistence
  // layer will keep writing v1 for now — the migration slot is ready.
  const isV2 = (r.schemaVersion === 2 || (r as { objects?: unknown }).objects !== undefined)

  const layers: WorkspaceLayer[] =
    Array.isArray(r.layers) && r.layers.length > 0
      ? (r.layers as Partial<WorkspaceLayer>[]).map((l, i) => ({
          id: typeof l.id === 'string' ? l.id : _newLayerId(),
          name: typeof l.name === 'string' && l.name.trim() ? l.name : `Layer ${i + 1}`,
          visible: l.visible !== false,
          locked: l.locked === true,
          order: typeof l.order === 'number' ? l.order : i,
        }))
      : seed.layers

  const layerIds = new Set(layers.map((l) => l.id))
  const fallbackLayerId = layers[0].id

  const rawNodes = isV2
    ? (Array.isArray(r.objects) ? r.objects : [])
    : (Array.isArray(r.nodes)   ? r.nodes   : [])

  const nodes: WorkspaceNode[] = (rawNodes as Record<string, unknown>[])
    .map((n) => hydrateNode(n, layerIds, fallbackLayerId, isV2))
    .filter((n): n is WorkspaceNode => n !== null)

  const v = r.viewport as Partial<WorkspaceViewport> | undefined
  const viewport: WorkspaceViewport = {
    x: Number(v?.x) || 0,
    y: Number(v?.y) || 0,
    scale: v?.scale != null ? clampScale(Number(v.scale)) : 1,
  }

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    nodes,
    layers,
    viewport,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  }
}

function clampScale(v: number): number {
  if (!Number.isFinite(v)) return 1
  return Math.min(5, Math.max(0.1, v))
}

function hydrateNode(
  n: Record<string, unknown>,
  layerIds: Set<string>,
  fallbackLayerId: string,
  isV2: boolean,
): WorkspaceNode | null {
  if (!n || typeof n !== 'object') return null

  const base = {
    id: typeof n.id === 'string' ? n.id : `n_${Math.random().toString(36).slice(2)}`,
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
    groupId: typeof n.groupId === 'string' ? (n.groupId as string) : null,
  }

  if (isV2) {
    // Convert v2 WorkspaceObject back to Sprint 6A WorkspaceNode.
    const kind = String(n.kind ?? 'placeholder')
    const category = kind === 'cabinet' ? 'led' : kind === 'lcd' ? 'lcd' : 'placeholder'
    const resolution = typeof n.resolution === 'object' && n.resolution !== null
      ? `${(n.resolution as { w?: number }).w ?? 0}x${(n.resolution as { h?: number }).h ?? 0}`
      : undefined
    return {
      ...base,
      catalogId: (n.libraryItemId as string | undefined) ?? '',
      category: category as WorkspaceNode['category'],
      meta: {
        manufacturer: n.manufacturer as string | undefined,
        pixelPitchMm: n.pixelPitchMm as number | undefined,
        resolution,
        accent: n.accent as WorkspaceNode['meta'] extends { accent?: infer A } ? A : never,
      },
    }
  }

  // Sprint 6A shape passthrough
  const meta = (n.meta as WorkspaceNode['meta']) ?? undefined
  return {
    ...base,
    catalogId: String(n.catalogId ?? ''),
    category: (n.category as WorkspaceNode['category']) ?? 'placeholder',
    meta,
  }
}

export function serialiseWorkspace(s: WorkspaceState): WorkspaceState {
  return { version: s.version, nodes: s.nodes, layers: s.layers, viewport: s.viewport, updatedAt: s.updatedAt }
}

export function workspaceEquals(a: WorkspaceState, b: WorkspaceState): boolean {
  return JSON.stringify(serialiseWorkspace(a)) === JSON.stringify(serialiseWorkspace(b))
}

/** Backwards-compatible layer factory (Sprint 6A signature). */
export function newLayer(name: string, order: number): WorkspaceLayer {
  return { id: _newLayerId(), name, visible: true, locked: false, order }
}

/* -------------------------------------------------------------------------- */
/* nodeFromCatalog — Sprint 6A signature preserved                             */
/* -------------------------------------------------------------------------- */

import { snapValue as _snap } from '@/engines/workspace-engine'
import { clampZoom as _clampZoom } from '@/engines/workspace-engine'

export function nodeFromCatalog(
  item: CabinetCatalogItem,
  worldX: number,
  worldY: number,
  layerId: string,
  zIndex: number,
): WorkspaceNode {
  return {
    id: `n_${Math.random().toString(36).slice(2)}`,
    catalogId: item.id,
    category: item.category,
    name: item.name,
    x: _snap(worldX - item.widthMm / 2, 10),
    y: _snap(worldY - item.heightMm / 2, 10),
    width: item.widthMm,
    height: item.heightMm,
    rotation: 0,
    layerId,
    locked: false,
    visible: true,
    zIndex,
    groupId: null,
    meta: {
      manufacturer: item.manufacturer,
      pixelPitchMm: item.pixelPitchMm,
      resolution: item.resolution,
      accent: item.accent,
    },
  }
}

/** Kept for consumers that used `clampZoom` (already re-exported above) — this
 *  extra import prevents tree-shakers from dropping the symbol. */
export const _CLAMP_ZOOM_ANCHOR = _clampZoom
