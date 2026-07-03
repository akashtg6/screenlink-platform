/**
 * Sprint 6A — Pure workspace engine.
 *
 * Contains all deterministic geometry / layout logic. No React, no Konva, no
 * DOM. Everything here is unit-testable with plain JS.
 */

import { v4 as uuid } from 'uuid'
import { SNAP_STEP, ZOOM_MAX, ZOOM_MIN } from './constants'
import type {
  CabinetCatalogItem,
  WorkspaceLayer,
  WorkspaceNode,
  WorkspaceState,
  WorkspaceViewport,
} from './types'
import { WORKSPACE_SCHEMA_VERSION } from './types'

/* -------------------------------------------------------------------------- */
/* IDs                                                                        */
/* -------------------------------------------------------------------------- */

export const newNodeId = (): string => `n_${uuid()}`
export const newLayerId = (): string => `l_${uuid()}`
export const newGroupId = (): string => `g_${uuid()}`

/* -------------------------------------------------------------------------- */
/* Snap / clamp                                                               */
/* -------------------------------------------------------------------------- */

export function snapValue(value: number, step: number = SNAP_STEP): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export function snapPoint(x: number, y: number, step: number = SNAP_STEP): { x: number; y: number } {
  return { x: snapValue(x, step), y: snapValue(y, step) }
}

export function clampZoom(scale: number): number {
  if (!Number.isFinite(scale)) return 1
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale))
}

/* -------------------------------------------------------------------------- */
/* Rotated-AABB helpers                                                       */
/* -------------------------------------------------------------------------- */

export interface Aabb { minX: number; minY: number; maxX: number; maxY: number }

/** Returns the world-space AABB of a rectangle after rotation about its centre. */
export function rotatedAabb(node: Pick<WorkspaceNode, 'x' | 'y' | 'width' | 'height' | 'rotation'>): Aabb {
  const cx = node.x + node.width / 2
  const cy = node.y + node.height / 2
  const rad = (node.rotation * Math.PI) / 180
  const c = Math.cos(rad), s = Math.sin(rad)
  const hw = node.width / 2, hh = node.height / 2
  const corners = [
    [-hw, -hh], [ hw, -hh], [ hw,  hh], [-hw,  hh],
  ].map(([dx, dy]) => ({
    x: cx + dx * c - dy * s,
    y: cy + dx * s + dy * c,
  }))
  const xs = corners.map(p => p.x)
  const ys = corners.map(p => p.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function nodeBounds(node: WorkspaceNode): Aabb {
  return rotatedAabb(node)
}

export function unionBounds(nodes: WorkspaceNode[]): Aabb | null {
  if (nodes.length === 0) return null
  let b: Aabb | null = null
  for (const n of nodes) {
    const ab = nodeBounds(n)
    if (!b) { b = { ...ab }; continue }
    b.minX = Math.min(b.minX, ab.minX)
    b.minY = Math.min(b.minY, ab.minY)
    b.maxX = Math.max(b.maxX, ab.maxX)
    b.maxY = Math.max(b.maxY, ab.maxY)
  }
  return b
}

/** Does a node's AABB intersect the given rectangle (world-space)? */
export function intersectsRect(node: WorkspaceNode, rect: Aabb): boolean {
  const b = nodeBounds(node)
  return !(b.maxX < rect.minX || b.minX > rect.maxX || b.maxY < rect.minY || b.minY > rect.maxY)
}

/* -------------------------------------------------------------------------- */
/* Alignment                                                                  */
/* -------------------------------------------------------------------------- */

export type AlignEdge =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'centerH' | 'centerV'

export type DistributeAxis = 'horizontal' | 'vertical'

/** Return new positions for the given nodes so they align to the requested edge
 *  of their common bounding box. Node dimensions and rotation are unchanged. */
export function alignNodes(nodes: WorkspaceNode[], edge: AlignEdge): WorkspaceNode[] {
  if (nodes.length < 2) return nodes
  const bounds = unionBounds(nodes)
  if (!bounds) return nodes

  return nodes.map((n) => {
    const b = nodeBounds(n)
    const w = b.maxX - b.minX
    const h = b.maxY - b.minY
    let dx = 0, dy = 0
    switch (edge) {
      case 'left':    dx = bounds.minX - b.minX; break
      case 'right':   dx = bounds.maxX - b.maxX; break
      case 'top':     dy = bounds.minY - b.minY; break
      case 'bottom':  dy = bounds.maxY - b.maxY; break
      case 'centerH': dx = (bounds.minX + (bounds.maxX - bounds.minX) / 2) - (b.minX + w / 2); break
      case 'centerV': dy = (bounds.minY + (bounds.maxY - bounds.minY) / 2) - (b.minY + h / 2); break
    }
    return { ...n, x: n.x + dx, y: n.y + dy }
  })
}

/** Redistribute so gaps between AABBs are equal along the chosen axis. */
export function distributeNodes(nodes: WorkspaceNode[], axis: DistributeAxis): WorkspaceNode[] {
  if (nodes.length < 3) return nodes

  const sorted = [...nodes].sort((a, b) => {
    const ab = nodeBounds(a), bb = nodeBounds(b)
    return axis === 'horizontal' ? ab.minX - bb.minX : ab.minY - bb.minY
  })

  const first = nodeBounds(sorted[0])
  const last  = nodeBounds(sorted[sorted.length - 1])

  const totalSpan = axis === 'horizontal'
    ? last.maxX - first.minX
    : last.maxY - first.minY
  const sizesSum = sorted.reduce((acc, n) => {
    const b = nodeBounds(n)
    return acc + (axis === 'horizontal' ? (b.maxX - b.minX) : (b.maxY - b.minY))
  }, 0)
  const gap = (totalSpan - sizesSum) / (sorted.length - 1)

  const anchor = axis === 'horizontal' ? first.minX : first.minY

  const moved = new Map<string, { dx: number; dy: number }>()
  let cursor = anchor
  for (const n of sorted) {
    const b = nodeBounds(n)
    const size = axis === 'horizontal' ? (b.maxX - b.minX) : (b.maxY - b.minY)
    const targetMin = cursor
    const currentMin = axis === 'horizontal' ? b.minX : b.minY
    const delta = targetMin - currentMin
    if (axis === 'horizontal') moved.set(n.id, { dx: delta, dy: 0 })
    else                        moved.set(n.id, { dx: 0, dy: delta })
    cursor = targetMin + size + gap
  }

  return nodes.map((n) => {
    const m = moved.get(n.id)
    return m ? { ...n, x: n.x + m.dx, y: n.y + m.dy } : n
  })
}

/* -------------------------------------------------------------------------- */
/* Z-order                                                                    */
/* -------------------------------------------------------------------------- */

/** Normalise zIndex values within a layer so they are contiguous starting at 0. */
export function normaliseZIndex(nodes: WorkspaceNode[]): WorkspaceNode[] {
  const byLayer: Record<string, WorkspaceNode[]> = {}
  for (const n of nodes) (byLayer[n.layerId] ??= []).push(n)

  const idToZ = new Map<string, number>()
  for (const list of Object.values(byLayer)) {
    list.sort((a, b) => a.zIndex - b.zIndex)
    list.forEach((n, i) => idToZ.set(n.id, i))
  }
  return nodes.map((n) => ({ ...n, zIndex: idToZ.get(n.id) ?? n.zIndex }))
}

export function bringForward(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  const normed = normaliseZIndex(nodes)
  return normed.map((n) => {
    if (!ids.has(n.id)) return n
    return { ...n, zIndex: n.zIndex + 1.5 }
  })
}

export function sendBackward(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  const normed = normaliseZIndex(nodes)
  return normed.map((n) => {
    if (!ids.has(n.id)) return n
    return { ...n, zIndex: n.zIndex - 1.5 }
  })
}

export function bringToFront(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  const max = nodes.reduce((m, n) => (n.zIndex > m ? n.zIndex : m), 0)
  return nodes.map((n) => ids.has(n.id) ? { ...n, zIndex: max + 1 } : n)
}

export function sendToBack(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  const min = nodes.reduce((m, n) => (n.zIndex < m ? n.zIndex : m), 0)
  return nodes.map((n) => ids.has(n.id) ? { ...n, zIndex: min - 1 } : n)
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                   */
/* -------------------------------------------------------------------------- */

export function groupNodes(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  if (ids.size < 2) return nodes
  const gid = newGroupId()
  return nodes.map((n) => ids.has(n.id) ? { ...n, groupId: gid } : n)
}

export function ungroupNodes(nodes: WorkspaceNode[], ids: Set<string>): WorkspaceNode[] {
  const affectedGroups = new Set(
    nodes.filter((n) => ids.has(n.id) && n.groupId).map((n) => n.groupId as string),
  )
  if (affectedGroups.size === 0) return nodes
  return nodes.map((n) => (n.groupId && affectedGroups.has(n.groupId)) ? { ...n, groupId: null } : n)
}

/** Given a set of node ids, expand it to include all group siblings. */
export function expandGroupSelection(nodes: WorkspaceNode[], ids: string[]): string[] {
  const idSet = new Set(ids)
  const groups = new Set(
    nodes.filter((n) => idSet.has(n.id) && n.groupId).map((n) => n.groupId as string),
  )
  if (groups.size === 0) return ids
  const result = new Set(ids)
  for (const n of nodes) if (n.groupId && groups.has(n.groupId)) result.add(n.id)
  return Array.from(result)
}

/* -------------------------------------------------------------------------- */
/* Duplication                                                                */
/* -------------------------------------------------------------------------- */

export function duplicateNodes(
  source: WorkspaceNode[],
  offsetMm: number = 40,
): { clones: WorkspaceNode[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>()
  const groupMap = new Map<string, string>()
  const clones: WorkspaceNode[] = source.map((n) => {
    const cloneId = newNodeId()
    idMap.set(n.id, cloneId)
    let newGid: string | undefined | null = null
    if (n.groupId) {
      if (!groupMap.has(n.groupId)) groupMap.set(n.groupId, newGroupId())
      newGid = groupMap.get(n.groupId) ?? null
    }
    return {
      ...n,
      id: cloneId,
      x: n.x + offsetMm,
      y: n.y + offsetMm,
      groupId: newGid,
    }
  })
  return { clones, idMap }
}

/* -------------------------------------------------------------------------- */
/* Instantiation                                                              */
/* -------------------------------------------------------------------------- */

export function nodeFromCatalog(
  item: CabinetCatalogItem,
  worldX: number,
  worldY: number,
  layerId: string,
  zIndex: number,
): WorkspaceNode {
  return {
    id: newNodeId(),
    catalogId: item.id,
    category: item.category,
    name: item.name,
    x: snapValue(worldX - item.widthMm / 2),
    y: snapValue(worldY - item.heightMm / 2),
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

/* -------------------------------------------------------------------------- */
/* Layers                                                                     */
/* -------------------------------------------------------------------------- */

export function newLayer(name: string, order: number): WorkspaceLayer {
  return { id: newLayerId(), name, visible: true, locked: false, order }
}

/* -------------------------------------------------------------------------- */
/* Persistence — create / hydrate                                             */
/* -------------------------------------------------------------------------- */

export function emptyWorkspaceState(): WorkspaceState {
  const primary = newLayer('Layout', 0)
  return {
    version: WORKSPACE_SCHEMA_VERSION,
    nodes: [],
    layers: [primary],
    viewport: { x: 0, y: 0, scale: 1 },
    updatedAt: new Date(0).toISOString(),
  }
}

/** Sanitise & migrate a persisted payload into a valid WorkspaceState. */
export function hydrateWorkspaceState(raw: unknown): WorkspaceState {
  const seed = emptyWorkspaceState()
  if (!raw || typeof raw !== 'object') return seed

  const r = raw as Partial<WorkspaceState>
  const layers: WorkspaceLayer[] =
    Array.isArray(r.layers) && r.layers.length > 0
      ? r.layers.map((l, i) => ({
          id: typeof l.id === 'string' ? l.id : newLayerId(),
          name: typeof l.name === 'string' && l.name.trim() ? l.name : `Layer ${i + 1}`,
          visible: l.visible !== false,
          locked: l.locked === true,
          order: typeof l.order === 'number' ? l.order : i,
        }))
      : seed.layers

  const layerIds = new Set(layers.map((l) => l.id))
  const fallbackLayerId = layers[0].id

  const nodes: WorkspaceNode[] =
    Array.isArray(r.nodes)
      ? r.nodes
          .filter((n): n is WorkspaceNode => !!n && typeof n === 'object')
          .map((n) => ({
            id: typeof n.id === 'string' ? n.id : newNodeId(),
            catalogId: String(n.catalogId ?? ''),
            category: (n.category as WorkspaceNode['category']) ?? 'placeholder',
            name: String(n.name ?? 'Item'),
            x: Number(n.x) || 0,
            y: Number(n.y) || 0,
            width: Math.max(1, Number(n.width) || 100),
            height: Math.max(1, Number(n.height) || 100),
            rotation: Number(n.rotation) || 0,
            layerId: layerIds.has(n.layerId) ? n.layerId : fallbackLayerId,
            locked: n.locked === true,
            visible: n.visible !== false,
            zIndex: Number(n.zIndex) || 0,
            groupId: typeof n.groupId === 'string' ? n.groupId : null,
            meta: (n.meta as WorkspaceNode['meta']) ?? undefined,
          }))
      : []

  const v = r.viewport as WorkspaceViewport | undefined
  const viewport: WorkspaceViewport = {
    x: Number(v?.x) || 0,
    y: Number(v?.y) || 0,
    scale: clampZoom(Number(v?.scale) || 1),
  }

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    nodes: normaliseZIndex(nodes),
    layers,
    viewport,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  }
}

/** Deep equality check used to short-circuit autosave when nothing changed. */
export function workspaceEquals(a: WorkspaceState, b: WorkspaceState): boolean {
  return JSON.stringify(serialiseWorkspace(a)) === JSON.stringify(serialiseWorkspace(b))
}

/** Serialise for persistence — excludes runtime-only fields (currently none). */
export function serialiseWorkspace(s: WorkspaceState): WorkspaceState {
  return {
    version: s.version,
    nodes: s.nodes,
    layers: s.layers,
    viewport: s.viewport,
    updatedAt: s.updatedAt,
  }
}
