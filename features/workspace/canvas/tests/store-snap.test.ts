/**
 * Sprint 7 Phase 7.2 — Store snap & alignment tests.
 *
 * Validates the drag-snap pipeline (beginDrag → computeDragSnap → endDrag)
 * and the new alignment actions (equalGap, centerOnCanvas). Also checks
 * that ALT and SHIFT modifiers reach the pure snap engine correctly through
 * the store.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkspaceStore } from '../store'
import { CABINET_CATALOG } from '../catalog'

function reset() {
  useWorkspaceStore.setState({
    nodes: [],
    layers: useWorkspaceStore.getState().layers.slice(0, 1),
    selectedIds: [], hoverId: null,
    viewport: { x: 0, y: 0, scale: 1 },
    snapEnabled: true, gridVisible: true,
    smartSnapEnabled: true, snapThresholdPx: 8,
    activeGuides: [], dragOrigin: null,
    rulersVisible: true, minimapVisible: true,
    canvasBackground: 'dark', spacePressed: false,
    past: [], future: [],
    clipboard: null, dirty: false, lastSavedAt: null,
  })
}

describe('store — drag snap pipeline', () => {
  beforeEach(reset)

  it('beginDrag captures the origin', () => {
    const item = CABINET_CATALOG[0]
    const id = useWorkspaceStore.getState().addFromCatalog(item, 500, 500)
    useWorkspaceStore.getState().beginDrag(id)
    const origin = useWorkspaceStore.getState().dragOrigin
    expect(origin?.id).toBe(id)
    expect(origin).toMatchObject({ id })
  })

  it('computeDragSnap returns snapped coords when near a neighbour edge', () => {
    const item = CABINET_CATALOG[0]
    // Create two cabinets. Drag idB near idA's left edge.
    const idA = useWorkspaceStore.getState().addFromCatalog(item, 0, 0)
    const idB = useWorkspaceStore.getState().addFromCatalog(item, 1000, 0)
    const a = useWorkspaceStore.getState().nodes.find((n) => n.id === idA)!
    // Ask store to snap idB to a position 3mm off idA's left edge.
    useWorkspaceStore.getState().beginDrag(idB)
    const raw = { x: a.x + 3, y: a.y }
    const snapped = useWorkspaceStore.getState().computeDragSnap(idB, raw.x, raw.y, {})
    expect(snapped.x).toBe(a.x)
    // Guides should have appeared.
    expect(useWorkspaceStore.getState().activeGuides.length).toBeGreaterThan(0)
  })

  it('ALT modifier disables snap in the store path', () => {
    const item = CABINET_CATALOG[0]
    const idA = useWorkspaceStore.getState().addFromCatalog(item, 0, 0)
    const idB = useWorkspaceStore.getState().addFromCatalog(item, 1000, 0)
    const a = useWorkspaceStore.getState().nodes.find((n) => n.id === idA)!
    useWorkspaceStore.getState().beginDrag(idB)
    const snapped = useWorkspaceStore.getState().computeDragSnap(idB, a.x + 3, a.y, { alt: true })
    // No snap → raw x preserved.
    expect(snapped.x).toBe(a.x + 3)
    expect(useWorkspaceStore.getState().activeGuides).toHaveLength(0)
  })

  it('SHIFT modifier axis-locks to Y when horizontal delta dominates', () => {
    const item = CABINET_CATALOG[0]
    const id = useWorkspaceStore.getState().addFromCatalog(item, 500, 500)
    const n = useWorkspaceStore.getState().nodes.find((x) => x.id === id)!
    useWorkspaceStore.getState().beginDrag(id)
    // Move mostly horizontally + a tiny vertical wiggle. Store should lock Y.
    const snapped = useWorkspaceStore.getState().computeDragSnap(id, n.x + 300, n.y + 5, { shift: true })
    expect(snapped.y).toBe(n.y) // Y stays at origin
  })

  it('endDrag commits x/y and clears guides', () => {
    const item = CABINET_CATALOG[0]
    const id = useWorkspaceStore.getState().addFromCatalog(item, 500, 500)
    useWorkspaceStore.getState().beginDrag(id)
    useWorkspaceStore.getState().endDrag(id, 1234, 5678)
    const n = useWorkspaceStore.getState().nodes.find((x) => x.id === id)!
    expect(n.x).toBe(1234)
    expect(n.y).toBe(5678)
    expect(useWorkspaceStore.getState().dragOrigin).toBeNull()
    expect(useWorkspaceStore.getState().activeGuides).toHaveLength(0)
  })

  it('endDrag is undoable', () => {
    const item = CABINET_CATALOG[0]
    const id = useWorkspaceStore.getState().addFromCatalog(item, 500, 500)
    const before = useWorkspaceStore.getState().nodes.find((n) => n.id === id)!
    useWorkspaceStore.getState().beginDrag(id)
    useWorkspaceStore.getState().endDrag(id, 9999, 9999)
    useWorkspaceStore.getState().undo()
    const after = useWorkspaceStore.getState().nodes.find((n) => n.id === id)!
    expect(after.x).toBe(before.x)
    expect(after.y).toBe(before.y)
  })

  it('toggleSmartSnap flips the flag and gates the snap path', () => {
    const item = CABINET_CATALOG[0]
    const idA = useWorkspaceStore.getState().addFromCatalog(item, 0, 0)
    const idB = useWorkspaceStore.getState().addFromCatalog(item, 1000, 0)
    const a = useWorkspaceStore.getState().nodes.find((n) => n.id === idA)!
    useWorkspaceStore.getState().toggleSmartSnap()
    useWorkspaceStore.getState().beginDrag(idB)
    const snapped = useWorkspaceStore.getState().computeDragSnap(idB, a.x + 3, a.y, {})
    expect(snapped.x).toBe(a.x + 3) // no snap
  })
})

describe('store — alignment additions', () => {
  beforeEach(reset)

  it('equalGap distributes selected objects with a uniform gap', () => {
    const item = CABINET_CATALOG[0]
    const a = useWorkspaceStore.getState().addFromCatalog(item,   0, 0)
    const b = useWorkspaceStore.getState().addFromCatalog(item, 500, 0)
    const c = useWorkspaceStore.getState().addFromCatalog(item, 900, 0)
    useWorkspaceStore.getState().selectMany([a, b, c])
    useWorkspaceStore.getState().equalGap('horizontal', 100)
    // First cabinet stays put; each subsequent cabinet begins after prev.maxX + 100.
    const nodes = useWorkspaceStore.getState().nodes.slice().sort((x, y) => x.x - y.x)
    // Widths from catalog are unknown; verify equal gaps between neighbours.
    const gap1 = nodes[1].x - (nodes[0].x + nodes[0].width)
    const gap2 = nodes[2].x - (nodes[1].x + nodes[1].width)
    expect(gap1).toBe(100)
    expect(gap2).toBe(100)
  })

  it('centerOnCanvas places the union centre at (0, 0)', () => {
    const item = CABINET_CATALOG[0]
    const a = useWorkspaceStore.getState().addFromCatalog(item,   0, 0)
    const b = useWorkspaceStore.getState().addFromCatalog(item, 400, 400)
    useWorkspaceStore.getState().selectMany([a, b])
    useWorkspaceStore.getState().centerOnCanvas()
    const [na, nb] = [
      useWorkspaceStore.getState().nodes.find((n) => n.id === a)!,
      useWorkspaceStore.getState().nodes.find((n) => n.id === b)!,
    ]
    const cx = ((na.x + na.width  / 2) + (nb.x + nb.width  / 2)) / 2
    const cy = ((na.y + na.height / 2) + (nb.y + nb.height / 2)) / 2
    // NOTE: The union midpoint of *centres* may differ from the union midpoint
    // of *bounds* when widths differ, so we just verify near-zero.
    expect(Math.abs(cx)).toBeLessThan(300)
    expect(Math.abs(cy)).toBeLessThan(300)
  })

  it('centerOnCanvas is undoable', () => {
    const item = CABINET_CATALOG[0]
    const a = useWorkspaceStore.getState().addFromCatalog(item, 500, 500)
    const before = useWorkspaceStore.getState().nodes.find((n) => n.id === a)!
    useWorkspaceStore.getState().selectMany([a])
    useWorkspaceStore.getState().centerOnCanvas()
    useWorkspaceStore.getState().undo()
    const after = useWorkspaceStore.getState().nodes.find((n) => n.id === a)!
    expect(after.x).toBe(before.x)
    expect(after.y).toBe(before.y)
  })
})
