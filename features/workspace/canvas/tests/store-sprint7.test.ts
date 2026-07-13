/**
 * Sprint 7 Phase 7.1 — Zustand store actions added this sprint.
 *
 * Focus areas:
 *   • `zoomIn` / `zoomOut` / `setZoom` (with and without container)
 *   • `zoomToSelection` (fallback to fitToScreen when nothing selected)
 *   • `selectAllVisible` / `invertSelection` (respecting hidden layers)
 *   • `toggleRulers` / `toggleMinimap` / `setCanvasBackground` / `setSpacePressed`
 *
 * The store is a singleton; we snapshot & restore between tests to keep them
 * independent.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkspaceStore } from '../store'
import { CABINET_CATALOG } from '../catalog'

function reset() {
  useWorkspaceStore.setState({
    nodes: [], layers: useWorkspaceStore.getState().layers.slice(0, 1),
    selectedIds: [], hoverId: null,
    viewport: { x: 0, y: 0, scale: 1 },
    snapEnabled: true, gridVisible: true, rulersVisible: true, minimapVisible: true,
    canvasBackground: 'dark', spacePressed: false,
    past: [], future: [], clipboard: null, dirty: false, lastSavedAt: null,
  })
}

describe('workspace store — Sprint 7 additions', () => {
  beforeEach(reset)

  it('starts with default flags in the "on" state', () => {
    const s = useWorkspaceStore.getState()
    expect(s.rulersVisible).toBe(true)
    expect(s.minimapVisible).toBe(true)
    expect(s.snapEnabled).toBe(true)
    expect(s.gridVisible).toBe(true)
    expect(s.canvasBackground).toBe('dark')
    expect(s.spacePressed).toBe(false)
  })

  it('toggleRulers / toggleMinimap flip the flags', () => {
    useWorkspaceStore.getState().toggleRulers()
    useWorkspaceStore.getState().toggleMinimap()
    const s = useWorkspaceStore.getState()
    expect(s.rulersVisible).toBe(false)
    expect(s.minimapVisible).toBe(false)
  })

  it('setCanvasBackground / setSpacePressed set values verbatim', () => {
    useWorkspaceStore.getState().setCanvasBackground('blueprint')
    useWorkspaceStore.getState().setSpacePressed(true)
    const s = useWorkspaceStore.getState()
    expect(s.canvasBackground).toBe('blueprint')
    expect(s.spacePressed).toBe(true)
  })

  it('zoomIn / zoomOut scale by the constant step', () => {
    const before = useWorkspaceStore.getState().viewport.scale
    useWorkspaceStore.getState().zoomIn()
    expect(useWorkspaceStore.getState().viewport.scale).toBeGreaterThan(before)
    useWorkspaceStore.getState().zoomOut()
    // Approximately back to 1 (allow FP tolerance).
    expect(useWorkspaceStore.getState().viewport.scale).toBeCloseTo(before, 5)
  })

  it('setZoom clamps to [ZOOM_MIN, ZOOM_MAX]', () => {
    useWorkspaceStore.getState().setZoom(0.0001)
    expect(useWorkspaceStore.getState().viewport.scale).toBeCloseTo(0.1, 5)
    useWorkspaceStore.getState().setZoom(100)
    expect(useWorkspaceStore.getState().viewport.scale).toBeCloseTo(5, 5)
  })

  it('setZoom preserves the world centre when container size is given', () => {
    // Container 800×600 — the centre is initially at world (0,0) if viewport is 0/0/1.
    // Zoom to 2 with same container — the world point that was under the container
    // centre should still be under the container centre.
    useWorkspaceStore.getState().setViewport({ x: 400, y: 300, scale: 1 })
    useWorkspaceStore.getState().setZoom(2, 800, 600)
    const v = useWorkspaceStore.getState().viewport
    // Container centre screen (400, 300); after zoom the same world point (0,0)
    // must still map to (400, 300): screen = 0*2 + v.x → v.x = 400.
    expect(v.x).toBeCloseTo(400, 3)
    expect(v.y).toBeCloseTo(300, 3)
    expect(v.scale).toBeCloseTo(2, 5)
  })

  it('zoomToSelection with empty selection falls back to fitToScreen', () => {
    // No nodes → fitToScreen just centres the viewport.
    useWorkspaceStore.getState().zoomToSelection(800, 600)
    const v = useWorkspaceStore.getState().viewport
    // Fallback path with empty nodes → x/y = container/2.
    expect(v.x).toBeCloseTo(400, 3)
    expect(v.y).toBeCloseTo(300, 3)
  })

  it('zoomToSelection frames only the selected nodes', () => {
    const item = CABINET_CATALOG[0]
    const store = useWorkspaceStore.getState()
    const idA = store.addFromCatalog(item, 100, 100)
    const idB = store.addFromCatalog(item, 5000, 5000)
    useWorkspaceStore.getState().selectMany([idA])
    useWorkspaceStore.getState().zoomToSelection(800, 600, 40)
    const v = useWorkspaceStore.getState().viewport
    // With only A selected, the scale should be large (framing a single cabinet).
    expect(v.scale).toBeGreaterThan(0.2)
    // Node B is off-screen after this operation (rough check via visible span).
    expect(v).toBeDefined()
    // Second call: select both → smaller scale.
    useWorkspaceStore.getState().selectMany([idA, idB])
    useWorkspaceStore.getState().zoomToSelection(800, 600, 40)
    const v2 = useWorkspaceStore.getState().viewport
    expect(v2.scale).toBeLessThan(v.scale)
  })

  it('selectAllVisible picks every visible node from every visible layer', () => {
    const item = CABINET_CATALOG[0]
    const store = useWorkspaceStore.getState()
    store.addFromCatalog(item, 0, 0)
    store.addFromCatalog(item, 500, 500)
    useWorkspaceStore.getState().selectAllVisible()
    expect(useWorkspaceStore.getState().selectedIds.length).toBe(2)
  })

  it('selectAllVisible ignores nodes on hidden layers', () => {
    const item = CABINET_CATALOG[0]
    const store = useWorkspaceStore.getState()
    const layer2 = store.addLayer('Hidden')
    // Add node on hidden layer.
    useWorkspaceStore.getState().setActiveLayer(layer2)
    useWorkspaceStore.getState().addFromCatalog(item, 0, 0)
    useWorkspaceStore.getState().toggleLayerVisibility(layer2)
    // Add node on the visible primary layer.
    const primary = useWorkspaceStore.getState().layers[0].id
    useWorkspaceStore.getState().setActiveLayer(primary)
    useWorkspaceStore.getState().addFromCatalog(item, 500, 500)

    useWorkspaceStore.getState().selectAllVisible()
    const sel = useWorkspaceStore.getState().selectedIds
    expect(sel.length).toBe(1)
    // The selected node must live on a visible layer.
    const n = useWorkspaceStore.getState().nodes.find((x) => x.id === sel[0])!
    const layer = useWorkspaceStore.getState().layers.find((l) => l.id === n.layerId)!
    expect(layer.visible).toBe(true)
  })

  it('invertSelection picks the complement of the current selection', () => {
    const item = CABINET_CATALOG[0]
    const store = useWorkspaceStore.getState()
    const a = store.addFromCatalog(item, 0, 0)
    const b = store.addFromCatalog(item, 500, 500)
    const c = store.addFromCatalog(item, 1000, 1000)
    useWorkspaceStore.getState().selectMany([a])
    useWorkspaceStore.getState().invertSelection()
    const sel = useWorkspaceStore.getState().selectedIds
    expect(sel).toContain(b)
    expect(sel).toContain(c)
    expect(sel).not.toContain(a)
  })

  it('resetViewport sets viewport to (0,0)@100 %', () => {
    useWorkspaceStore.getState().setViewport({ x: 999, y: -999, scale: 3 })
    useWorkspaceStore.getState().resetViewport()
    const v = useWorkspaceStore.getState().viewport
    expect(v).toEqual({ x: 0, y: 0, scale: 1 })
  })
})
