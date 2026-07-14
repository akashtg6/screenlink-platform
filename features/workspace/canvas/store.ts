/**
 * Sprint 6A — Zustand workspace store.
 *
 * Single source of truth for the interactive canvas: nodes, layers, selection,
 * viewport, clipboard and an undo/redo history. Persistence to the database
 * is a *separate concern* (see `use-workspace-persistence.ts`).
 *
 * Design notes:
 *  - Every mutation goes through an `apply()` helper that pushes the previous
 *    state onto the undo stack; this keeps history semantics identical for
 *    both hotkey-driven and UI-driven changes.
 *  - Viewport updates are treated as ephemeral (not pushed into history) to
 *    avoid polluting undo with every wheel-scroll.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { workspaceEventBus } from '@/features/workspace/stores'
import { newEventId } from '@/engines/workspace-engine'
import type {
  CabinetCatalogItem,
  WorkspaceLayer,
  WorkspaceNode,
  WorkspaceState,
  WorkspaceViewport,
} from './types'
import {
  AUTOSAVE_INTERVAL_MS as _AUTOSAVE_INTERVAL_MS, // re-exported for consumers
  HISTORY_LIMIT,
  SNAP_STEP,
} from './constants'
import {
  alignNodes,
  bringForward as bringForwardOp,
  bringToFront as bringToFrontOp,
  clampZoom,
  distributeNodes,
  duplicateNodes,
  emptyWorkspaceState,
  expandGroupSelection,
  groupNodes,
  hydrateWorkspaceState,
  newLayer,
  nodeFromCatalog,
  normaliseZIndex,
  sendBackward as sendBackwardOp,
  sendToBack as sendToBackOp,
  snapValue,
  ungroupNodes,
} from './engine'
import { equalGapObjects, centreObjectsAt, computeSmartSnap, type SnapGuide } from '@/engines/workspace-engine'
import type { AlignEdge, DistributeAxis } from './engine'
import { fitNodesViewport } from './viewport-math'
import { ZOOM_STEP } from './constants'

/** Sprint 7 — background presets applied to the canvas container. */
export type CanvasBackground = 'dark' | 'light' | 'blueprint'

export { _AUTOSAVE_INTERVAL_MS as AUTOSAVE_INTERVAL_MS }

/* -------------------------------------------------------------------------- */
/* Store shape                                                                */
/* -------------------------------------------------------------------------- */

interface HistoryEntry {
  nodes: WorkspaceNode[]
  layers: WorkspaceLayer[]
}

export interface WorkspaceStore {
  // ——— persisted domain state
  nodes: WorkspaceNode[]
  layers: WorkspaceLayer[]
  viewport: WorkspaceViewport

  // ——— ephemeral UI state
  selectedIds: string[]
  hoverId: string | null
  activeLayerId: string
  clipboard: WorkspaceNode[] | null
  snapEnabled: boolean
  smartSnapEnabled: boolean
  snapThresholdPx: number
  activeGuides: SnapGuide[]
  dragOrigin: { id: string; x: number; y: number } | null
  gridVisible: boolean
  rulersVisible: boolean
  minimapVisible: boolean
  canvasBackground: CanvasBackground
  spacePressed: boolean
  dirty: boolean
  lastSavedAt: string | null

  // ——— history
  past: HistoryEntry[]
  future: HistoryEntry[]

  // ——— lifecycle
  hydrate(raw: unknown): void
  markSaved(iso?: string): void
  toJSON(): WorkspaceState

  // ——— selection
  selectOne(id: string | null, additive?: boolean): void
  selectMany(ids: string[]): void
  clearSelection(): void
  selectAllVisible(): void
  invertSelection(): void
  setHover(id: string | null): void

  // ——— mutations
  addFromCatalog(item: CabinetCatalogItem, worldX: number, worldY: number): string
  updateNode(id: string, patch: Partial<WorkspaceNode>): void
  updateSelected(patch: Partial<WorkspaceNode>): void
  moveSelected(dx: number, dy: number): void
  deleteSelected(): void
  duplicateSelected(): void
  copySelected(): void
  paste(): void
  align(edge: AlignEdge): void
  distribute(axis: DistributeAxis): void
  equalGap(axis: DistributeAxis, gap?: number): void
  centerOnCanvas(): void
  bringForward(): void
  sendBackward(): void
  bringToFront(): void
  sendToBack(): void
  group(): void
  ungroup(): void
  rotateSelected(deltaDeg: number): void

  // ——— layers
  addLayer(name?: string): string
  renameLayer(id: string, name: string): void
  toggleLayerVisibility(id: string): void
  toggleLayerLock(id: string): void
  reorderLayer(id: string, newOrder: number): void
  deleteLayer(id: string): void
  setActiveLayer(id: string): void

  // ——— viewport
  setViewport(v: Partial<WorkspaceViewport>): void
  zoomAt(clientX: number, clientY: number, factor: number, containerRect: DOMRect): void
  zoomIn(): void
  zoomOut(): void
  setZoom(scale: number, containerWidth?: number, containerHeight?: number): void
  fitToScreen(containerWidth: number, containerHeight: number, padding?: number): void
  zoomToSelection(containerWidth: number, containerHeight: number, padding?: number): void
  resetViewport(): void

  // ——— toggles
  toggleSnap(): void
  toggleSmartSnap(): void
  toggleGrid(): void
  toggleRulers(): void
  toggleMinimap(): void
  setCanvasBackground(bg: CanvasBackground): void
  setSpacePressed(pressed: boolean): void

  // ——— drag & snap (Sprint 7)
  beginDrag(id: string): void
  computeDragSnap(id: string, rawX: number, rawY: number, mods: { alt?: boolean; shift?: boolean }): { x: number; y: number }
  endDrag(id: string, x: number, y: number): void
  clearGuides(): void

  // ——— undo / redo
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function snapshot(nodes: WorkspaceNode[], layers: WorkspaceLayer[]): HistoryEntry {
  return {
    nodes: nodes.map((n) => ({ ...n })),
    layers: layers.map((l) => ({ ...l })),
  }
}

function visibleUnlockedSelected(nodes: WorkspaceNode[], layers: WorkspaceLayer[], ids: string[]) {
  const lockedLayers = new Set(layers.filter((l) => l.locked || !l.visible).map((l) => l.id))
  return nodes.filter((n) => ids.includes(n.id) && !n.locked && !lockedLayers.has(n.layerId))
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export const useWorkspaceStore = create<WorkspaceStore>()(
  subscribeWithSelector((set, get) => {
    const seed = emptyWorkspaceState()

    /** Apply a mutation with history + dirty tracking + event bus broadcast. */
    const apply = (mutate: (draft: { nodes: WorkspaceNode[]; layers: WorkspaceLayer[] }) => void) => {
      const { nodes, layers, past } = get()
      const before = snapshot(nodes, layers)
      const draft = { nodes: [...nodes], layers: [...layers] }
      mutate(draft)
      const nextPast = [...past, before]
      if (nextPast.length > HISTORY_LIMIT) nextPast.shift()
      const nextNodes = normaliseZIndex(draft.nodes)
      set({
        nodes: nextNodes,
        layers: draft.layers,
        past: nextPast,
        future: [],
        dirty: true,
      })
      // Sprint 6B \u2014 broadcast on every mutation so future subscribers
      // (collaboration, analytics, AI, audit) can hook in without touching
      // the store. Kept as coarse `objects.replaced` / `layers.reordered`
      // for now; Sprint 6C will emit fine-grained events per command.
      workspaceEventBus.emit({
        id: newEventId(),
        timestamp: new Date().toISOString(),
        source: 'user',
        event: { type: 'objects.replaced', payload: { objects: nextNodes as unknown as import('@/engines/workspace-engine').WorkspaceObject[] } },
      })
      if (before.layers !== draft.layers) {
        workspaceEventBus.emit({
          id: newEventId(),
          timestamp: new Date().toISOString(),
          source: 'user',
          event: { type: 'layers.reordered', payload: { layers: draft.layers } },
        })
      }
    }

    const primary = seed.layers[0]

    return {
      nodes: seed.nodes,
      layers: seed.layers,
      viewport: seed.viewport,

      selectedIds: [],
      hoverId: null,
      activeLayerId: primary.id,
      clipboard: null,
      snapEnabled: true,
      smartSnapEnabled: true,
      snapThresholdPx: 8,
      activeGuides: [],
      dragOrigin: null,
      gridVisible: true,
      rulersVisible: true,
      minimapVisible: true,
      canvasBackground: 'dark',
      spacePressed: false,
      dirty: false,
      lastSavedAt: null,

      past: [],
      future: [],

      /* ------------------------------------------------------------ lifecycle */

      hydrate(raw) {
        const state = hydrateWorkspaceState(raw)
        const active = state.layers[0]?.id ?? primary.id
        set({
          nodes: state.nodes,
          layers: state.layers,
          viewport: state.viewport,
          activeLayerId: active,
          selectedIds: [],
          hoverId: null,
          past: [],
          future: [],
          dirty: false,
          lastSavedAt: state.updatedAt !== new Date(0).toISOString() ? state.updatedAt : null,
        })
      },

      markSaved(iso) {
        set({ dirty: false, lastSavedAt: iso ?? new Date().toISOString() })
      },

      toJSON() {
        const { nodes, layers, viewport } = get()
        return {
          version: 1,
          nodes,
          layers,
          viewport,
          updatedAt: new Date().toISOString(),
        }
      },

      /* ------------------------------------------------------------ selection */

      selectOne(id, additive = false) {
        const { nodes, selectedIds } = get()
        if (id === null) { set({ selectedIds: [] }); return }
        let next: string[]
        if (additive) {
          next = selectedIds.includes(id)
            ? selectedIds.filter((s) => s !== id)
            : [...selectedIds, id]
        } else {
          next = [id]
        }
        set({ selectedIds: expandGroupSelection(nodes, next) })
      },

      selectMany(ids) {
        const { nodes } = get()
        set({ selectedIds: expandGroupSelection(nodes, [...new Set(ids)]) })
      },

      clearSelection() {
        set({ selectedIds: [] })
      },

      selectAllVisible() {
        const { nodes, layers } = get()
        const hidden = new Set(layers.filter((l) => !l.visible).map((l) => l.id))
        const ids = nodes.filter((n) => n.visible && !hidden.has(n.layerId)).map((n) => n.id)
        set({ selectedIds: expandGroupSelection(nodes, ids) })
      },

      invertSelection() {
        const { nodes, layers, selectedIds } = get()
        const hidden = new Set(layers.filter((l) => !l.visible).map((l) => l.id))
        const current = new Set(selectedIds)
        const next = nodes
          .filter((n) => n.visible && !hidden.has(n.layerId) && !current.has(n.id))
          .map((n) => n.id)
        set({ selectedIds: expandGroupSelection(nodes, next) })
      },

      setHover(id) { set({ hoverId: id }) },

      /* ------------------------------------------------------------ mutations */

      addFromCatalog(item, worldX, worldY) {
        const { nodes, activeLayerId } = get()
        const layerNodes = nodes.filter((n) => n.layerId === activeLayerId)
        const nextZ = layerNodes.reduce((m, n) => Math.max(m, n.zIndex), -1) + 1
        const node = nodeFromCatalog(item, worldX, worldY, activeLayerId, nextZ)
        apply((d) => { d.nodes.push(node) })
        set({ selectedIds: [node.id] })
        return node.id
      },

      updateNode(id, patch) {
        apply((d) => {
          const idx = d.nodes.findIndex((n) => n.id === id)
          if (idx < 0) return
          d.nodes[idx] = { ...d.nodes[idx], ...patch }
        })
      },

      updateSelected(patch) {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            if (selectedIds.includes(d.nodes[i].id) && !d.nodes[i].locked) {
              d.nodes[i] = { ...d.nodes[i], ...patch }
            }
          }
        })
      },

      moveSelected(dx, dy) {
        const { selectedIds, snapEnabled } = get()
        if (selectedIds.length === 0) return
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            const n = d.nodes[i]
            if (!selectedIds.includes(n.id) || n.locked) continue
            const nx = n.x + dx
            const ny = n.y + dy
            d.nodes[i] = {
              ...n,
              x: snapEnabled ? snapValue(nx, SNAP_STEP) : nx,
              y: snapEnabled ? snapValue(ny, SNAP_STEP) : ny,
            }
          }
        })
      },

      deleteSelected() {
        const { selectedIds, nodes, layers } = get()
        const targets = new Set(visibleUnlockedSelected(nodes, layers, selectedIds).map((n) => n.id))
        if (targets.size === 0) return
        apply((d) => { d.nodes = d.nodes.filter((n) => !targets.has(n.id)) })
        set({ selectedIds: [] })
      },

      duplicateSelected() {
        const { selectedIds, nodes } = get()
        if (selectedIds.length === 0) return
        const source = nodes.filter((n) => selectedIds.includes(n.id))
        const { clones } = duplicateNodes(source)
        apply((d) => { d.nodes.push(...clones) })
        set({ selectedIds: clones.map((c) => c.id) })
      },

      copySelected() {
        const { selectedIds, nodes } = get()
        if (selectedIds.length === 0) return
        const src = nodes.filter((n) => selectedIds.includes(n.id)).map((n) => ({ ...n }))
        set({ clipboard: src })
      },

      paste() {
        const { clipboard } = get()
        if (!clipboard || clipboard.length === 0) return
        const { clones } = duplicateNodes(clipboard, 40)
        apply((d) => { d.nodes.push(...clones) })
        set({ selectedIds: clones.map((c) => c.id) })
      },

      align(edge) {
        const { selectedIds, nodes } = get()
        if (selectedIds.length < 2) return
        const source = nodes.filter((n) => selectedIds.includes(n.id) && !n.locked)
        const aligned = alignNodes(source, edge)
        const byId = new Map(aligned.map((n) => [n.id, n]))
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            const rep = byId.get(d.nodes[i].id)
            if (rep) d.nodes[i] = rep
          }
        })
      },

      distribute(axis) {
        const { selectedIds, nodes } = get()
        if (selectedIds.length < 3) return
        const source = nodes.filter((n) => selectedIds.includes(n.id) && !n.locked)
        const distributed = distributeNodes(source, axis)
        const byId = new Map(distributed.map((n) => [n.id, n]))
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            const rep = byId.get(d.nodes[i].id)
            if (rep) d.nodes[i] = rep
          }
        })
      },

      equalGap(axis, gap) {
        const { selectedIds, nodes } = get()
        if (selectedIds.length < 3) return
        const source = nodes.filter((n) => selectedIds.includes(n.id) && !n.locked)
        const laid = equalGapObjects(source, axis, gap)
        const byId = new Map(laid.map((n) => [n.id, n]))
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            const rep = byId.get(d.nodes[i].id)
            if (rep) d.nodes[i] = rep
          }
        })
      },

      centerOnCanvas() {
        const { selectedIds, nodes } = get()
        if (selectedIds.length === 0) return
        const source = nodes.filter((n) => selectedIds.includes(n.id) && !n.locked)
        // "Canvas centre" == world origin (0, 0) — matches the ruler zero.
        const centred = centreObjectsAt(source, 0, 0)
        const byId = new Map(centred.map((n) => [n.id, n]))
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            const rep = byId.get(d.nodes[i].id)
            if (rep) d.nodes[i] = rep
          }
        })
      },

      bringForward() {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => { d.nodes = bringForwardOp(d.nodes, new Set(selectedIds)) })
      },

      sendBackward() {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => { d.nodes = sendBackwardOp(d.nodes, new Set(selectedIds)) })
      },

      bringToFront() {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => { d.nodes = bringToFrontOp(d.nodes, new Set(selectedIds)) })
      },

      sendToBack() {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => { d.nodes = sendToBackOp(d.nodes, new Set(selectedIds)) })
      },

      group() {
        const { selectedIds } = get()
        if (selectedIds.length < 2) return
        apply((d) => { d.nodes = groupNodes(d.nodes, new Set(selectedIds)) })
      },

      ungroup() {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => { d.nodes = ungroupNodes(d.nodes, new Set(selectedIds)) })
      },

      rotateSelected(deltaDeg) {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        apply((d) => {
          for (let i = 0; i < d.nodes.length; i++) {
            if (!selectedIds.includes(d.nodes[i].id) || d.nodes[i].locked) continue
            const next = (d.nodes[i].rotation + deltaDeg) % 360
            d.nodes[i] = { ...d.nodes[i], rotation: (next + 360) % 360 }
          }
        })
      },

      /* ------------------------------------------------------------ layers */

      addLayer(name) {
        const { layers } = get()
        const layer = newLayer(name || `Layer ${layers.length + 1}`, layers.length)
        apply((d) => { d.layers.push(layer) })
        set({ activeLayerId: layer.id })
        return layer.id
      },

      renameLayer(id, name) {
        apply((d) => {
          const l = d.layers.find((x) => x.id === id)
          if (l) l.name = name || l.name
        })
      },

      toggleLayerVisibility(id) {
        apply((d) => {
          const l = d.layers.find((x) => x.id === id)
          if (l) l.visible = !l.visible
        })
      },

      toggleLayerLock(id) {
        apply((d) => {
          const l = d.layers.find((x) => x.id === id)
          if (l) l.locked = !l.locked
        })
      },

      reorderLayer(id, newOrder) {
        apply((d) => {
          d.layers.sort((a, b) => a.order - b.order)
          const idx = d.layers.findIndex((l) => l.id === id)
          if (idx < 0) return
          const [layer] = d.layers.splice(idx, 1)
          const clamped = Math.min(d.layers.length, Math.max(0, newOrder))
          d.layers.splice(clamped, 0, layer)
          d.layers.forEach((l, i) => (l.order = i))
        })
      },

      deleteLayer(id) {
        const { layers } = get()
        if (layers.length <= 1) return // never delete the last layer
        apply((d) => {
          const fallback = d.layers.find((l) => l.id !== id)?.id
          d.layers = d.layers.filter((l) => l.id !== id)
          d.layers.forEach((l, i) => (l.order = i))
          if (!fallback) return
          d.nodes = d.nodes.map((n) => (n.layerId === id ? { ...n, layerId: fallback } : n))
        })
        const remaining = get().layers[0]?.id
        if (remaining) set({ activeLayerId: remaining })
      },

      setActiveLayer(id) { set({ activeLayerId: id }) },

      /* ------------------------------------------------------------ viewport */

      setViewport(v) {
        const { viewport } = get()
        const next = {
          x: v.x ?? viewport.x,
          y: v.y ?? viewport.y,
          scale: v.scale != null ? clampZoom(v.scale) : viewport.scale,
        }
        set({ viewport: next })
        workspaceEventBus.emit({
          id: newEventId(),
          timestamp: new Date().toISOString(),
          source: 'user',
          event: { type: 'viewport.changed', payload: { viewport: next } },
        })
      },

      zoomAt(clientX, clientY, factor, rect) {
        const { viewport } = get()
        const newScale = clampZoom(viewport.scale * factor)
        if (newScale === viewport.scale) return
        // Screen point relative to canvas origin
        const px = clientX - rect.left
        const py = clientY - rect.top
        // World point under cursor before the zoom
        const worldX = (px - viewport.x) / viewport.scale
        const worldY = (py - viewport.y) / viewport.scale
        // New offset so the same world point stays under the cursor.
        const nx = px - worldX * newScale
        const ny = py - worldY * newScale
        set({ viewport: { x: nx, y: ny, scale: newScale } })
      },

      fitToScreen(containerWidth, containerHeight, padding = 80) {
        const { nodes } = get()
        if (nodes.length === 0) {
          set({ viewport: { x: containerWidth / 2, y: containerHeight / 2, scale: 1 } })
          return
        }
        const next = fitNodesViewport(nodes, containerWidth, containerHeight, padding)
        if (next) set({ viewport: next })
      },

      zoomToSelection(containerWidth, containerHeight, padding = 100) {
        const { nodes, selectedIds } = get()
        if (selectedIds.length === 0) { get().fitToScreen(containerWidth, containerHeight, padding); return }
        const selected = nodes.filter((n) => selectedIds.includes(n.id))
        if (selected.length === 0) return
        const next = fitNodesViewport(selected, containerWidth, containerHeight, padding)
        if (next) set({ viewport: next })
      },

      resetViewport() {
        // Use container-agnostic reset: origin visible in top-left, 100% zoom.
        set({ viewport: { x: 0, y: 0, scale: 1 } })
      },

      zoomIn() {
        const { viewport } = get()
        set({ viewport: { ...viewport, scale: clampZoom(viewport.scale * ZOOM_STEP) } })
      },

      zoomOut() {
        const { viewport } = get()
        set({ viewport: { ...viewport, scale: clampZoom(viewport.scale / ZOOM_STEP) } })
      },

      setZoom(scale, containerWidth, containerHeight) {
        const { viewport } = get()
        const nextScale = clampZoom(scale)
        // Preserve world-space centre when a container is given.
        if (containerWidth && containerHeight) {
          const cx = (containerWidth  / 2 - viewport.x) / viewport.scale
          const cy = (containerHeight / 2 - viewport.y) / viewport.scale
          set({ viewport: { x: containerWidth / 2 - cx * nextScale, y: containerHeight / 2 - cy * nextScale, scale: nextScale } })
        } else {
          set({ viewport: { ...viewport, scale: nextScale } })
        }
      },

      /* ------------------------------------------------------------ toggles */

      toggleSnap()      { set({ snapEnabled:      !get().snapEnabled }) },
      toggleSmartSnap() { set({ smartSnapEnabled: !get().smartSnapEnabled }) },
      toggleGrid()      { set({ gridVisible:      !get().gridVisible }) },
      toggleRulers()    { set({ rulersVisible:    !get().rulersVisible }) },
      toggleMinimap()   { set({ minimapVisible:   !get().minimapVisible }) },
      setCanvasBackground(bg) { set({ canvasBackground: bg }) },
      setSpacePressed(pressed) { set({ spacePressed: pressed }) },

      /* ------------------------------------------------------------ drag & snap */

      beginDrag(id) {
        const n = get().nodes.find((x) => x.id === id)
        if (!n) return
        set({ dragOrigin: { id, x: n.x, y: n.y }, activeGuides: [] })
      },

      computeDragSnap(id, rawX, rawY, mods) {
        const { nodes, viewport, snapEnabled, smartSnapEnabled, snapThresholdPx, dragOrigin } = get()
        const dragging = nodes.find((n) => n.id === id)
        if (!dragging) return { x: rawX, y: rawY }
        const origin = dragOrigin?.id === id ? dragOrigin : { id, x: dragging.x, y: dragging.y }

        // SHIFT axis-lock: infer axis from bigger delta from origin.
        let constrain: 'x' | 'y' | null = null
        if (mods.shift) {
          const dx = Math.abs(rawX - origin.x)
          const dy = Math.abs(rawY - origin.y)
          constrain = dx >= dy ? 'x' : 'y'
        }

        const disable = !smartSnapEnabled || mods.alt === true
        const neighbours = nodes
          .filter((n) => n.id !== id && n.visible)
          .map((n) => ({ id: n.id, minX: n.x, minY: n.y, maxX: n.x + n.width, maxY: n.y + n.height }))

        const result = computeSmartSnap({
          x: rawX, y: rawY,
          width: dragging.width, height: dragging.height,
          originX: origin.x, originY: origin.y,
          neighbours,
          scale: viewport.scale,
          thresholdPx: snapThresholdPx,
          settings: { enabled: snapEnabled, stepMm: SNAP_STEP },
          disable,
          constrain,
        })

        set({ activeGuides: result.guides })
        return { x: result.x, y: result.y }
      },

      endDrag(id, x, y) {
        // Commit final position through the normal history-tracked path.
        apply((d) => {
          const idx = d.nodes.findIndex((n) => n.id === id)
          if (idx < 0) return
          d.nodes[idx] = { ...d.nodes[idx], x, y }
        })
        set({ dragOrigin: null, activeGuides: [] })
      },

      clearGuides() { set({ activeGuides: [] }) },

      /* ------------------------------------------------------------ history */

      undo() {
        const { past, nodes, layers, future } = get()
        const prev = past[past.length - 1]
        if (!prev) return
        set({
          nodes: prev.nodes,
          layers: prev.layers,
          past: past.slice(0, -1),
          future: [snapshot(nodes, layers), ...future],
          dirty: true,
          selectedIds: [],
        })
      },

      redo() {
        const { future, nodes, layers, past } = get()
        const next = future[0]
        if (!next) return
        set({
          nodes: next.nodes,
          layers: next.layers,
          past: [...past, snapshot(nodes, layers)],
          future: future.slice(1),
          dirty: true,
          selectedIds: [],
        })
      },

      canUndo() { return get().past.length > 0 },
      canRedo() { return get().future.length > 0 },
    }
  }),
)
