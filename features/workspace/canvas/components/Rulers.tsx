'use client'

/**
 * Sprint 7 — Rulers.
 *
 * Two thin (24px) rulers pinned to the top and left of the canvas viewport.
 * Ticks are generated from `viewport-math.generateRulerTicks` using the same
 * "nice" grid step that the canvas grid picks — so ruler ticks and grid lines
 * always coincide.
 *
 * Rendered with plain <canvas> for GPU-friendly text; sized to the container
 * via ResizeObserver.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { generateRulerTicks, pickGridStep } from '../viewport-math'

const RULER_THICKNESS = 22
const RULER_BG = '#0f1521'
const RULER_TEXT = 'rgba(226,232,240,0.75)'
const RULER_TICK_MINOR = 'rgba(148,163,184,0.35)'
const RULER_TICK_MAJOR = 'rgba(226,232,240,0.85)'
const RULER_CURSOR_LINE = 'rgba(56,189,248,0.75)'

interface Props {
  /** Width of the canvas viewport in CSS pixels. */
  width: number
  /** Height of the canvas viewport in CSS pixels. */
  height: number
  /** Cursor world position (mm) — draws a live indicator line on both rulers. */
  cursorWorld?: { x: number; y: number } | null
}

export function Rulers({ width, height, cursorWorld }: Props) {
  const viewport   = useWorkspaceStore((s) => s.viewport)
  const visible    = useWorkspaceStore((s) => s.rulersVisible)
  const topRef     = React.useRef<HTMLCanvasElement | null>(null)
  const leftRef    = React.useRef<HTMLCanvasElement | null>(null)

  const step = pickGridStep(viewport.scale)

  // Paint horizontal ruler (top)
  React.useEffect(() => {
    const cv = topRef.current
    if (!cv || width <= 0) return
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    cv.width  = Math.floor(width * dpr)
    cv.height = Math.floor(RULER_THICKNESS * dpr)
    cv.style.width  = `${width}px`
    cv.style.height = `${RULER_THICKNESS}px`
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = RULER_BG
    ctx.fillRect(0, 0, width, RULER_THICKNESS)
    ctx.font = '9px ui-monospace, monospace'
    ctx.textBaseline = 'middle'

    const ticks = generateRulerTicks('x', viewport, width, step)
    for (const t of ticks) {
      ctx.strokeStyle = t.major ? RULER_TICK_MAJOR : RULER_TICK_MINOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(t.positionPx + 0.5, t.major ? RULER_THICKNESS - 8 : RULER_THICKNESS - 4)
      ctx.lineTo(t.positionPx + 0.5, RULER_THICKNESS)
      ctx.stroke()
      if (t.major) {
        ctx.fillStyle = RULER_TEXT
        const label = formatMm(t.worldMm)
        ctx.fillText(label, t.positionPx + 3, RULER_THICKNESS / 2 - 1)
      }
    }
    // Cursor indicator
    if (cursorWorld) {
      const px = cursorWorld.x * viewport.scale + viewport.x
      if (px >= 0 && px <= width) {
        ctx.strokeStyle = RULER_CURSOR_LINE
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px + 0.5, 0)
        ctx.lineTo(px + 0.5, RULER_THICKNESS)
        ctx.stroke()
      }
    }
  }, [width, viewport, step, cursorWorld])

  // Paint vertical ruler (left)
  React.useEffect(() => {
    const cv = leftRef.current
    if (!cv || height <= 0) return
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    cv.width  = Math.floor(RULER_THICKNESS * dpr)
    cv.height = Math.floor(height * dpr)
    cv.style.width  = `${RULER_THICKNESS}px`
    cv.style.height = `${height}px`
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = RULER_BG
    ctx.fillRect(0, 0, RULER_THICKNESS, height)
    ctx.font = '9px ui-monospace, monospace'
    ctx.textBaseline = 'middle'

    const ticks = generateRulerTicks('y', viewport, height, step)
    for (const t of ticks) {
      ctx.strokeStyle = t.major ? RULER_TICK_MAJOR : RULER_TICK_MINOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(t.major ? RULER_THICKNESS - 8 : RULER_THICKNESS - 4, t.positionPx + 0.5)
      ctx.lineTo(RULER_THICKNESS, t.positionPx + 0.5)
      ctx.stroke()
      if (t.major) {
        ctx.save()
        ctx.translate(RULER_THICKNESS / 2 - 1, t.positionPx + 3)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = RULER_TEXT
        ctx.fillText(formatMm(t.worldMm), 0, 0)
        ctx.restore()
      }
    }
    if (cursorWorld) {
      const py = cursorWorld.y * viewport.scale + viewport.y
      if (py >= 0 && py <= height) {
        ctx.strokeStyle = RULER_CURSOR_LINE
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, py + 0.5)
        ctx.lineTo(RULER_THICKNESS, py + 0.5)
        ctx.stroke()
      }
    }
  }, [height, viewport, step, cursorWorld])

  if (!visible) return null

  return (
    <>
      {/* Top ruler */}
      <canvas
        ref={topRef}
        className="pointer-events-none absolute left-[22px] top-0 z-10 select-none"
        aria-hidden
      />
      {/* Left ruler */}
      <canvas
        ref={leftRef}
        className="pointer-events-none absolute left-0 top-[22px] z-10 select-none"
        aria-hidden
      />
      {/* Corner square */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-[22px] w-[22px] border-b border-r border-border/50 bg-[#0f1521]" />
    </>
  )
}

function formatMm(mm: number): string {
  const abs = Math.abs(mm)
  if (abs >= 10_000) return `${(mm / 1000).toFixed(1)}m`
  if (abs >= 1000)   return `${(mm / 1000).toFixed(2)}m`
  return `${Math.round(mm)}`
}

export const RULER_THICKNESS_PX = RULER_THICKNESS
