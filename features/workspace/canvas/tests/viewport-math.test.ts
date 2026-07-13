/**
 * Sprint 7 Phase 7.1 — Viewport math tests.
 *
 * Everything in `viewport-math.ts` is pure and framework-agnostic.
 * These tests lock in the guarantees that Rulers, ZoomIndicator and the
 * store all depend on.
 */
import { describe, it, expect } from 'vitest'
import {
  screenToWorld,
  worldToScreen,
  fitBoundsViewport,
  fitNodesViewport,
  pickGridStep,
  pickGridOpacity,
  formatZoomPercent,
  generateRulerTicks,
  isMeaningfulMarquee,
} from '../viewport-math'
import type { WorkspaceNode } from '../types'

function n(over: Partial<WorkspaceNode>): WorkspaceNode {
  return {
    id: over.id ?? Math.random().toString(36),
    catalogId: 't', category: 'placeholder', name: 'N',
    x: 0, y: 0, width: 100, height: 100,
    rotation: 0, layerId: 'L1', locked: false, visible: true,
    zIndex: 0, groupId: null, ...over,
  }
}

describe('viewport-math — screen / world conversions', () => {
  const rect = { left: 0, top: 0 }
  it('round-trips at scale 1 with zero offset', () => {
    const v = { x: 0, y: 0, scale: 1 }
    const world = screenToWorld(100, 200, rect, v)
    expect(world).toEqual({ x: 100, y: 200 })
    const screen = worldToScreen(world.x, world.y, v)
    expect(screen).toEqual({ x: 100, y: 200 })
  })
  it('round-trips at scale 2 with offset (50, 50)', () => {
    const v = { x: 50, y: 50, scale: 2 }
    const world = screenToWorld(150, 250, rect, v)
    // (150-50)/2 = 50 ; (250-50)/2 = 100
    expect(world).toEqual({ x: 50, y: 100 })
    const screen = worldToScreen(world.x, world.y, v)
    expect(screen).toEqual({ x: 150, y: 250 })
  })
  it('respects the container rect offset', () => {
    const v = { x: 0, y: 0, scale: 1 }
    expect(screenToWorld(100, 100, { left: 40, top: 20 }, v)).toEqual({ x: 60, y: 80 })
  })
})

describe('viewport-math — fitBounds / fitNodes', () => {
  it('centres bounds inside the container', () => {
    const v = fitBoundsViewport({ minX: 0, minY: 0, maxX: 500, maxY: 500 }, 1000, 1000, 100)
    expect(v).not.toBeNull()
    // Bounds centre is (250, 250). With uniform scale, the centre should land at (500, 500).
    const cxScreen = 250 * v!.scale + v!.x
    const cyScreen = 250 * v!.scale + v!.y
    expect(cxScreen).toBeCloseTo(500, 3)
    expect(cyScreen).toBeCloseTo(500, 3)
  })
  it('returns null for degenerate bounds', () => {
    expect(fitBoundsViewport({ minX: 5, minY: 0, maxX: 5, maxY: 5 }, 500, 500)).toBeNull()
  })
  it('returns null when container is smaller than padding', () => {
    expect(fitBoundsViewport({ minX: 0, minY: 0, maxX: 100, maxY: 100 }, 50, 50, 100)).toBeNull()
  })
  it('fitNodesViewport → null for empty nodes', () => {
    expect(fitNodesViewport([], 500, 500)).toBeNull()
  })
  it('fitNodesViewport frames a 2-node layout', () => {
    const nodes = [n({ x: 0, y: 0 }), n({ x: 400, y: 400 })]
    const v = fitNodesViewport(nodes, 800, 600, 40)
    expect(v).not.toBeNull()
    // Bounds are 0..500 × 0..500, so scale should be limited by min side minus padding.
    // container 600 - 80 = 520 / 500 = 1.04 (limited by scale cap … actually clamped ≤5)
    expect(v!.scale).toBeGreaterThan(0.5)
    expect(v!.scale).toBeLessThanOrEqual(5)
  })
})

describe('viewport-math — pickGridStep', () => {
  it('returns baseStep at scale = 1', () => {
    const step = pickGridStep(1)
    // Should be 100 or a nearby "nice" number given target 50px.
    expect([25, 50, 100]).toContain(step)
  })
  it('picks a larger step at very low zoom', () => {
    const stepLow  = pickGridStep(0.05)
    const stepHigh = pickGridStep(1)
    expect(stepLow).toBeGreaterThan(stepHigh)
  })
  it('picks a smaller step at very high zoom', () => {
    const stepHi   = pickGridStep(5)
    const stepMid  = pickGridStep(1)
    expect(stepHi).toBeLessThan(stepMid)
  })
  it('fallback for non-finite scale', () => {
    expect(pickGridStep(NaN)).toBeGreaterThan(0)
    expect(pickGridStep(-1)).toBeGreaterThan(0)
  })
})

describe('viewport-math — pickGridOpacity', () => {
  it('fades below 0.25', () => {
    expect(pickGridOpacity(0.1)).toBeLessThan(pickGridOpacity(1))
  })
  it('fades above 3x zoom', () => {
    expect(pickGridOpacity(4)).toBeLessThan(pickGridOpacity(1))
  })
  it('always within [0, 1]', () => {
    for (const s of [0.01, 0.5, 1, 2, 3, 5, 100]) {
      const o = pickGridOpacity(s)
      expect(o).toBeGreaterThanOrEqual(0)
      expect(o).toBeLessThanOrEqual(1)
    }
  })
})

describe('viewport-math — formatZoomPercent', () => {
  it('rounds to the nearest %', () => {
    expect(formatZoomPercent(1)).toBe('100%')
    expect(formatZoomPercent(0.5)).toBe('50%')
    expect(formatZoomPercent(1.2345)).toBe('123%')
  })
})

describe('viewport-math — generateRulerTicks', () => {
  it('produces ticks covering the visible span (horizontal, scale=1)', () => {
    const ticks = generateRulerTicks('x', { x: 0, y: 0, scale: 1 }, 1000, 100)
    // Range 0..1000mm at step 100 → 11 ticks (0, 100, .. 1000).
    expect(ticks.length).toBeGreaterThanOrEqual(10)
    // Every 5th tick is major.
    const majorCount = ticks.filter((t) => t.major).length
    expect(majorCount).toBeGreaterThan(0)
    // Positions strictly increasing.
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i].positionPx).toBeGreaterThan(ticks[i - 1].positionPx)
    }
  })
  it('shifts ticks correctly when viewport is offset', () => {
    // Offset x=50 means world 0 is at screen x=50.
    const ticks = generateRulerTicks('x', { x: 50, y: 0, scale: 1 }, 400, 100)
    const zero = ticks.find((t) => t.worldMm === 0)
    expect(zero?.positionPx).toBeCloseTo(50, 3)
  })
  it('scales tick positions with zoom', () => {
    const t1 = generateRulerTicks('x', { x: 0, y: 0, scale: 1 }, 500, 100)
    const t2 = generateRulerTicks('x', { x: 0, y: 0, scale: 2 }, 500, 100)
    // At scale 2, the 100mm tick should sit at screen x=200 (not x=100).
    const at100_scale2 = t2.find((t) => t.worldMm === 100)
    const at100_scale1 = t1.find((t) => t.worldMm === 100)
    expect(at100_scale2!.positionPx).toBeCloseTo(200, 3)
    expect(at100_scale1!.positionPx).toBeCloseTo(100, 3)
  })
  it('never returns more than the safety cap of ticks', () => {
    const ticks = generateRulerTicks('x', { x: 0, y: 0, scale: 0.001 }, 100_000, 1)
    // Runaway scenario — still bounded.
    expect(ticks.length).toBeLessThanOrEqual(2001)
  })
})

describe('viewport-math — isMeaningfulMarquee', () => {
  it('rejects marquees below the threshold', () => {
    expect(isMeaningfulMarquee(1, 2)).toBe(false)
    expect(isMeaningfulMarquee(-2, 3)).toBe(false)
  })
  it('accepts marquees exceeding threshold on either axis', () => {
    expect(isMeaningfulMarquee(10, 0)).toBe(true)
    expect(isMeaningfulMarquee(0, -10)).toBe(true)
  })
  it('respects a custom threshold', () => {
    expect(isMeaningfulMarquee(6, 6, 10)).toBe(false)
    expect(isMeaningfulMarquee(15, 0, 10)).toBe(true)
  })
})
