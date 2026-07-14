/**
 * Sprint 7 Phase 7.2 — Alignment additions tests.
 *
 * Covers `equalGapObjects` and `centreObjectsAt`, both introduced in Phase 7.2.
 */
import { describe, it, expect } from 'vitest'
import { equalGapObjects, centreObjectsAt } from '../geometry'
import type { WorkspaceObject } from '../types'

// Minimal spatial-object stub compatible with the generic helpers.
type Obj = Pick<WorkspaceObject, 'id' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'layerId' | 'zIndex'>
const obj = (id: string, x: number, y: number, w = 100, h = 100): Obj => ({
  id, x, y, width: w, height: h, rotation: 0, layerId: 'L', zIndex: 0,
})

describe('geometry — equalGapObjects', () => {
  it('respects an explicit gap for horizontal layout', () => {
    const a = obj('a', 0,   0, 100, 100)
    const b = obj('b', 500, 0, 100, 100) // 400 gap
    const c = obj('c', 700, 0, 100, 100) // 100 gap from B
    const out = equalGapObjects([a, b, c], 'horizontal', 20)
    // After: a stays at 0..100, b at 120..220, c at 240..340
    const sorted = out.slice().sort((x, y) => x.x - y.x)
    expect(sorted[0].x).toBe(0)
    expect(sorted[1].x).toBe(120)
    expect(sorted[2].x).toBe(240)
  })
  it('derives median gap when none is given', () => {
    const a = obj('a', 0,   0, 100, 100)
    const b = obj('b', 150, 0, 100, 100) // gap 50
    const c = obj('c', 350, 0, 100, 100) // gap 100
    // Median of [50, 100] → 100. Uniform 100 gap → a:0, b:200, c:400.
    const out = equalGapObjects([a, b, c], 'horizontal')
    const sorted = out.slice().sort((x, y) => x.x - y.x)
    expect(sorted[0].x).toBe(0)
    expect(sorted[1].x).toBe(200)
    expect(sorted[2].x).toBe(400)
  })
  it('handles vertical axis symmetrically', () => {
    const a = obj('a', 0, 0,   100, 100)
    const b = obj('b', 0, 200, 100, 100) // gap 100
    const c = obj('c', 0, 400, 100, 100) // gap 100
    const out = equalGapObjects([a, b, c], 'vertical', 50)
    const sorted = out.slice().sort((x, y) => x.y - y.y)
    expect(sorted[0].y).toBe(0)
    expect(sorted[1].y).toBe(150)
    expect(sorted[2].y).toBe(300)
  })
  it('is a no-op with fewer than 3 objects', () => {
    const src = [obj('a', 0, 0), obj('b', 200, 0)]
    const out = equalGapObjects(src, 'horizontal', 999)
    expect(out).toBe(src)
  })
})

describe('geometry — centreObjectsAt', () => {
  it('centres a single object at (0,0)', () => {
    const out = centreObjectsAt([obj('a', 500, 500, 100, 100)])
    // Centre of a 100×100 box at (0,0) → x=-50, y=-50.
    expect(out[0].x).toBe(-50)
    expect(out[0].y).toBe(-50)
  })
  it('translates the union centre to the requested point', () => {
    const out = centreObjectsAt([
      obj('a', 0,   0,   100, 100),
      obj('b', 400, 400, 100, 100),
    ], 100, 100)
    // Original union centre = (250, 250). Target centre = (100, 100). dx=-150, dy=-150.
    const a = out.find((o) => o.id === 'a')!
    const b = out.find((o) => o.id === 'b')!
    expect(a.x).toBe(-150)
    expect(a.y).toBe(-150)
    expect(b.x).toBe(250)
    expect(b.y).toBe(250)
  })
  it('is a no-op on empty input', () => {
    expect(centreObjectsAt([])).toEqual([])
  })
})
