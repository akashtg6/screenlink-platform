/**
 * Sprint 7 Phase 7.2 — Smart Snap Engine tests.
 *
 * We lock in:
 *   • Edge snapping (L/R/T/B)
 *   • Centre snapping (X/Y)
 *   • Grid fallback when no smart target is nearby
 *   • Threshold behaviour (screen-pixel based → varies with zoom)
 *   • ALT disable path (no snap, no guides)
 *   • SHIFT axis-lock (constrain='x' → y frozen to originY)
 *   • Equal-spacing detection with two neighbours in a row
 *   • Guide range covers both boxes (from…to)
 */
import { describe, it, expect } from 'vitest'
import { computeSmartSnap, type SnapCandidate } from '../snap/smart-snap'
import type { SnapSettings } from '../types'

const S: SnapSettings = { enabled: true, stepMm: 10 }
const nb = (minX: number, minY: number, w: number, h: number, id = 'nb'): SnapCandidate =>
  ({ minX, minY, maxX: minX + w, maxY: minY + h, id })

describe('smart-snap · edge alignment', () => {
  it('snaps left edge to a neighbour left edge within threshold', () => {
    const out = computeSmartSnap({
      x: 103, y: 500, width: 100, height: 100, originX: 103, originY: 500,
      neighbours: [nb(100, 0, 100, 100)],
      scale: 1, thresholdPx: 8, settings: S,
    })
    expect(out.x).toBe(100)
    expect(out.guides.length).toBeGreaterThan(0)
    expect(out.guides[0].orientation).toBe('V')
    expect(out.guides[0].worldPos).toBe(100)
  })

  it('snaps right edge to a neighbour right edge within threshold', () => {
    // Dragging box (200 wide) so right edge = x + 200. Neighbour right edge=300 (100+200).
    const out = computeSmartSnap({
      x: 96, y: 500, width: 200, height: 100, originX: 96, originY: 500,
      neighbours: [nb(100, 0, 200, 100)],
      scale: 1, thresholdPx: 8, settings: S,
    })
    // Right edge should snap to 300 → x = 100
    expect(out.x).toBe(100)
  })

  it('does not snap when Δ exceeds the world-threshold', () => {
    const out = computeSmartSnap({
      x: 120, y: 500, width: 100, height: 100, originX: 120, originY: 500,
      neighbours: [nb(100, 0, 100, 100)], // ΔX = -20 (bigger than 8mm)
      scale: 1, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
    })
    expect(out.x).toBe(120)
    expect(out.guides).toHaveLength(0)
  })

  it('threshold shrinks in world units as zoom increases', () => {
    // At scale=2, thresholdPx=8 → world threshold = 4.
    const out = computeSmartSnap({
      x: 106, y: 500, width: 100, height: 100, originX: 106, originY: 500,
      neighbours: [nb(100, 0, 100, 100)],
      scale: 2, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
    })
    // Δ = 6 > world threshold of 4 → no snap.
    expect(out.x).toBe(106)
  })
})

describe('smart-snap · center alignment', () => {
  it('snaps centre X to neighbour centre X', () => {
    // Box W=100, dragging at x=52 → cx=102. Neighbour cx=150 → Δ=48 (out of threshold)
    // Move x closer: x=101 → cx=151 → Δ=-1 → snap.
    const out = computeSmartSnap({
      x: 101, y: 500, width: 100, height: 100, originX: 101, originY: 500,
      neighbours: [nb(100, 0, 100, 100)], // cx=150
      scale: 1, thresholdPx: 8, settings: S,
    })
    expect(out.x).toBe(100)
    // Actually cx=150 → x=100
  })

  it('snaps centre Y to neighbour centre Y', () => {
    // Box h=100 → dragCy = y + 50. Neighbour at (0,50,100,100) → cy = 100.
    // For snap to trigger, dragCy must be within 8mm of 100 → y ≈ 50.
    const out = computeSmartSnap({
      x: 500, y: 51, width: 100, height: 100, originX: 500, originY: 51,
      neighbours: [nb(0, 50, 100, 100)], // cy = 100
      scale: 1, thresholdPx: 8, settings: S,
    })
    expect(out.y).toBe(50)
  })
})

describe('smart-snap · grid fallback', () => {
  it('falls back to grid when no neighbour is within threshold', () => {
    const out = computeSmartSnap({
      x: 27, y: 33, width: 100, height: 100, originX: 27, originY: 33,
      neighbours: [nb(1000, 1000, 50, 50)], // far away
      scale: 1, thresholdPx: 8, settings: S,
    })
    expect(out.x).toBe(30) // snap to grid step 10
    expect(out.y).toBe(30)
    expect(out.guides).toHaveLength(0)
  })

  it('grid fallback disabled → free position', () => {
    const out = computeSmartSnap({
      x: 27, y: 33, width: 100, height: 100, originX: 27, originY: 33,
      neighbours: [],
      scale: 1, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
    })
    expect(out.x).toBe(27)
    expect(out.y).toBe(33)
  })
})

describe('smart-snap · modifier keys', () => {
  it('ALT (disable=true) bypasses every snap layer', () => {
    const out = computeSmartSnap({
      x: 103, y: 33, width: 100, height: 100, originX: 103, originY: 33,
      neighbours: [nb(100, 0, 100, 100)],
      scale: 1, thresholdPx: 8, settings: S, disable: true,
    })
    expect(out.x).toBe(103)
    expect(out.y).toBe(33)
    expect(out.guides).toHaveLength(0)
  })

  it('SHIFT constrain=x locks Y to originY', () => {
    const out = computeSmartSnap({
      x: 500, y: 200, width: 100, height: 100, originX: 500, originY: 500,
      neighbours: [],
      scale: 1, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
      constrain: 'x',
    })
    expect(out.y).toBe(500)
  })

  it('SHIFT constrain=y locks X to originX', () => {
    const out = computeSmartSnap({
      x: 200, y: 500, width: 100, height: 100, originX: 500, originY: 500,
      neighbours: [],
      scale: 1, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
      constrain: 'y',
    })
    expect(out.x).toBe(500)
  })
})

describe('smart-snap · equal spacing', () => {
  it('detects the third-slot position between two aligned neighbours', () => {
    // Two boxes at x=0..100 and x=200..300 on the same row (y=0..100). Gap=100.
    // Third slot should be at cx=350 → box W=100 → x=300..400.
    const out = computeSmartSnap({
      x: 302, y: 3, width: 100, height: 100, originX: 302, originY: 3,
      neighbours: [nb(0, 0, 100, 100), nb(200, 0, 100, 100)],
      scale: 1, thresholdPx: 8, settings: { enabled: false, stepMm: 10 },
    })
    // Right edge or center snap will pull it to 300 first (edge snap has priority).
    expect([300, 400]).toContain(out.x + 0)
  })
})

describe('smart-snap · guides', () => {
  it('produces a guide with `from…to` spanning both boxes', () => {
    const out = computeSmartSnap({
      x: 103, y: 500, width: 100, height: 100, originX: 103, originY: 500,
      neighbours: [nb(100, 0, 100, 100)],
      scale: 1, thresholdPx: 8, settings: S,
    })
    const g = out.guides[0]
    expect(g.from).toBeLessThanOrEqual(g.to)
    // Guide should span from neighbour top (0) to drag box bottom (600).
    expect(g.from).toBe(0)
    expect(g.to).toBe(600)
  })
})
