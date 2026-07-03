import { describe, it, expect } from 'vitest'
import {
  alignNodes,
  distributeNodes,
  snapValue,
  clampZoom,
  rotatedAabb,
  unionBounds,
  intersectsRect,
  normaliseZIndex,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  groupNodes,
  ungroupNodes,
  expandGroupSelection,
  duplicateNodes,
  emptyWorkspaceState,
  hydrateWorkspaceState,
  nodeFromCatalog,
} from '../engine'
import { CABINET_CATALOG, findCatalog } from '../catalog'
import type { WorkspaceNode } from '../types'

function n(over: Partial<WorkspaceNode>): WorkspaceNode {
  return {
    id: over.id ?? Math.random().toString(36),
    catalogId: 'test',
    category: 'placeholder',
    name: 'Node',
    x: 0, y: 0, width: 100, height: 100,
    rotation: 0,
    layerId: 'L1',
    locked: false,
    visible: true,
    zIndex: 0,
    groupId: null,
    ...over,
  }
}

describe('canvas engine — snap & zoom', () => {
  it('snapValue rounds to given step', () => {
    expect(snapValue(23, 10)).toBe(20)
    expect(snapValue(25, 10)).toBe(30)
    expect(snapValue(-7, 10)).toBe(-10)
  })
  it('clampZoom keeps values within [0.1, 5]', () => {
    expect(clampZoom(0.05)).toBe(0.1)
    expect(clampZoom(10)).toBe(5)
    expect(clampZoom(1.5)).toBeCloseTo(1.5)
  })
})

describe('rotatedAabb', () => {
  it('returns identity AABB when rotation is 0', () => {
    const b = rotatedAabb({ x: 10, y: 20, width: 30, height: 40, rotation: 0 })
    expect(b).toEqual({ minX: 10, minY: 20, maxX: 40, maxY: 60 })
  })
  it('90° rotation swaps width & height', () => {
    const b = rotatedAabb({ x: 0, y: 0, width: 100, height: 50, rotation: 90 })
    // centre is (50, 25); after 90°, box footprint is 50 wide, 100 tall.
    const w = b.maxX - b.minX
    const h = b.maxY - b.minY
    expect(Math.round(w)).toBe(50)
    expect(Math.round(h)).toBe(100)
  })
})

describe('alignment', () => {
  it('align left snaps all min-x to bounds min-x', () => {
    const a = alignNodes([
      n({ id: 'a', x: 0, y: 0 }),
      n({ id: 'b', x: 30, y: 20 }),
      n({ id: 'c', x: 60, y: 40 }),
    ], 'left')
    expect(a.every((v) => v.x === 0)).toBe(true)
  })
  it('centerH lines up centres', () => {
    const a = alignNodes([
      n({ id: 'a', x: 0, y: 0, width: 100 }),
      n({ id: 'b', x: 50, y: 0, width: 50 }),
    ], 'centerH')
    const centreX = (b: WorkspaceNode) => b.x + b.width / 2
    expect(centreX(a[0])).toBeCloseTo(centreX(a[1]))
  })
})

describe('distribution', () => {
  it('produces equal gaps horizontally', () => {
    const src = [
      n({ id: 'a', x: 0,   y: 0, width: 50 }),
      n({ id: 'b', x: 60,  y: 0, width: 50 }),
      n({ id: 'c', x: 400, y: 0, width: 50 }),
    ]
    const out = distributeNodes(src, 'horizontal')
    // Middle one should now sit halfway
    const gap1 = out[1].x - (out[0].x + out[0].width)
    const gap2 = out[2].x - (out[1].x + out[1].width)
    expect(Math.round(gap1)).toBe(Math.round(gap2))
  })
})

describe('z-order', () => {
  it('normaliseZIndex compacts values per-layer', () => {
    const nodes = [
      n({ id: 'a', zIndex: 5 }),
      n({ id: 'b', zIndex: 2 }),
      n({ id: 'c', zIndex: 100 }),
    ]
    const out = normaliseZIndex(nodes).sort((a, b) => a.zIndex - b.zIndex)
    expect(out.map((v) => v.zIndex)).toEqual([0, 1, 2])
  })
  it('bringForward / sendBackward move a node relative to its layer', () => {
    const src = [
      n({ id: 'a', zIndex: 0 }),
      n({ id: 'b', zIndex: 1 }),
      n({ id: 'c', zIndex: 2 }),
    ]
    const forward = normaliseZIndex(bringForward(src, new Set(['b'])))
    const zForward = new Map(forward.map((x) => [x.id, x.zIndex]))
    expect(zForward.get('b')).toBeGreaterThan(zForward.get('c') ?? -1)

    const backward = normaliseZIndex(sendBackward(src, new Set(['b'])))
    const zBack = new Map(backward.map((x) => [x.id, x.zIndex]))
    expect(zBack.get('b')).toBeLessThan(zBack.get('a') ?? Infinity)
  })
  it('bringToFront / sendToBack put node at extremes', () => {
    const src = [
      n({ id: 'a', zIndex: 0 }),
      n({ id: 'b', zIndex: 1 }),
    ]
    const top = normaliseZIndex(bringToFront(src, new Set(['a'])))
    expect(top.find((x) => x.id === 'a')!.zIndex).toBeGreaterThan(top.find((x) => x.id === 'b')!.zIndex)
    const back = normaliseZIndex(sendToBack(src, new Set(['b'])))
    expect(back.find((x) => x.id === 'b')!.zIndex).toBeLessThan(back.find((x) => x.id === 'a')!.zIndex)
  })
})

describe('grouping', () => {
  it('groups selected nodes with the same groupId and later ungroups them', () => {
    const src = [n({ id: 'a' }), n({ id: 'b' }), n({ id: 'c' })]
    const grouped = groupNodes(src, new Set(['a', 'b']))
    expect(grouped.find((v) => v.id === 'a')!.groupId).toBeTruthy()
    expect(grouped.find((v) => v.id === 'a')!.groupId).toBe(grouped.find((v) => v.id === 'b')!.groupId)
    expect(grouped.find((v) => v.id === 'c')!.groupId).toBeFalsy()

    const ungrouped = ungroupNodes(grouped, new Set(['a']))
    expect(ungrouped.find((v) => v.id === 'a')!.groupId).toBeFalsy()
    expect(ungrouped.find((v) => v.id === 'b')!.groupId).toBeFalsy()
  })
  it('expandGroupSelection pulls in siblings', () => {
    const src = [
      n({ id: 'a', groupId: 'g1' }),
      n({ id: 'b', groupId: 'g1' }),
      n({ id: 'c' }),
    ]
    const expanded = expandGroupSelection(src, ['a'])
    expect(new Set(expanded)).toEqual(new Set(['a', 'b']))
  })
})

describe('duplication', () => {
  it('produces cloned nodes with offset positions and preserves relative groups', () => {
    const src = [
      n({ id: 'a', x: 0, y: 0, groupId: 'g1' }),
      n({ id: 'b', x: 100, y: 0, groupId: 'g1' }),
    ]
    const { clones } = duplicateNodes(src, 25)
    expect(clones.length).toBe(2)
    expect(clones[0].id).not.toBe('a')
    expect(clones[0].x - src[0].x).toBe(25)
    // Both clones share a *new* groupId, distinct from the source's.
    expect(clones[0].groupId).toBeTruthy()
    expect(clones[0].groupId).toBe(clones[1].groupId)
    expect(clones[0].groupId).not.toBe('g1')
  })
})

describe('hydration', () => {
  it('emptyWorkspaceState has one layer and no nodes', () => {
    const s = emptyWorkspaceState()
    expect(s.nodes.length).toBe(0)
    expect(s.layers.length).toBe(1)
  })
  it('hydrateWorkspaceState survives malformed input', () => {
    const s = hydrateWorkspaceState({ nodes: 'not-an-array', layers: [] })
    expect(Array.isArray(s.nodes)).toBe(true)
    expect(s.layers.length).toBeGreaterThan(0)
  })
  it('hydrateWorkspaceState rebinds orphaned layerIds', () => {
    const s = hydrateWorkspaceState({
      nodes: [{ id: 'x', catalogId: 'c', category: 'placeholder', name: 'X',
        x: 0, y: 0, width: 50, height: 50, rotation: 0,
        layerId: 'MISSING', locked: false, visible: true, zIndex: 0 }],
      layers: [{ id: 'L1', name: 'One', visible: true, locked: false, order: 0 }],
    })
    expect(s.nodes[0].layerId).toBe('L1')
  })
})

describe('bounds & intersection', () => {
  it('unionBounds returns null for empty', () => {
    expect(unionBounds([])).toBeNull()
  })
  it('intersectsRect detects overlap', () => {
    const nd = n({ x: 0, y: 0, width: 100, height: 100 })
    expect(intersectsRect(nd, { minX: 50, minY: 50, maxX: 150, maxY: 150 })).toBe(true)
    expect(intersectsRect(nd, { minX: 200, minY: 0, maxX: 300, maxY: 50 })).toBe(false)
  })
})

describe('catalog', () => {
  it('every catalog item has a valid category and dimensions', () => {
    for (const item of CABINET_CATALOG) {
      expect(['led', 'lcd', 'placeholder']).toContain(item.category)
      expect(item.widthMm).toBeGreaterThan(0)
      expect(item.heightMm).toBeGreaterThan(0)
    }
  })
  it('LED items always carry a pitch', () => {
    for (const item of CABINET_CATALOG) {
      if (item.category === 'led') expect(item.pixelPitchMm).toBeGreaterThan(0)
    }
  })
  it('findCatalog returns registered items and undefined otherwise', () => {
    expect(findCatalog(CABINET_CATALOG[0].id)).toBeDefined()
    expect(findCatalog('nope')).toBeUndefined()
  })
  it('nodeFromCatalog centres the drop point', () => {
    const item = CABINET_CATALOG[0]
    const node = nodeFromCatalog(item, 1000, 1000, 'L1', 0)
    // Snapped, but centre must remain near the drop point.
    expect(Math.abs((node.x + node.width / 2) - 1000)).toBeLessThanOrEqual(10)
    expect(Math.abs((node.y + node.height / 2) - 1000)).toBeLessThanOrEqual(10)
    expect(node.width).toBe(item.widthMm)
  })
})
