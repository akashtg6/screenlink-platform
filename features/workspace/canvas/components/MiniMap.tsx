'use client'

/**
 * Sprint 6A — Minimap.
 *
 * Renders a scaled-down projection of the whole layout plus a viewport
 * rectangle. Click-drag inside the minimap re-centres the main viewport.
 * The minimap is intentionally a plain <canvas> (not react-konva) so it stays
 * lightweight and independent of the main Stage lifecycle.
 */

import * as React from 'react'
import { MINIMAP_HEIGHT, MINIMAP_WIDTH, ACCENT_HEX } from '../constants'
import type { WorkspaceNode, WorkspaceViewport } from '../types'

interface Props {
  nodes: WorkspaceNode[]
  viewport: WorkspaceViewport
  containerWidth: number
  containerHeight: number
  onCentreOn: (worldX: number, worldY: number) => void
}

export function MiniMap({ nodes, viewport, containerWidth, containerHeight, onCentreOn }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  // Compute world bounds covering both nodes AND currently visible viewport.
  const bounds = React.useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -500, minY: -500, maxX: 2500, maxY: 2500 }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + n.height)
    }
    // Include visible viewport so the user always sees "where they are".
    const vMinX = -viewport.x / viewport.scale
    const vMinY = -viewport.y / viewport.scale
    const vMaxX = vMinX + containerWidth / viewport.scale
    const vMaxY = vMinY + containerHeight / viewport.scale
    minX = Math.min(minX, vMinX); minY = Math.min(minY, vMinY)
    maxX = Math.max(maxX, vMaxX); maxY = Math.max(maxY, vMaxY)
    const padX = (maxX - minX) * 0.05
    const padY = (maxY - minY) * 0.05
    return { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY }
  }, [nodes, viewport, containerWidth, containerHeight])

  const scale = React.useMemo(() => {
    const w = bounds.maxX - bounds.minX
    const h = bounds.maxY - bounds.minY
    if (w <= 0 || h <= 0) return 0.01
    return Math.min(MINIMAP_WIDTH / w, MINIMAP_HEIGHT / h)
  }, [bounds])

  React.useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = MINIMAP_WIDTH * dpr
    cv.height = MINIMAP_HEIGHT * dpr
    cv.style.width = `${MINIMAP_WIDTH}px`
    cv.style.height = `${MINIMAP_HEIGHT}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#0a0f18'
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    // Nodes
    for (const n of nodes) {
      if (!n.visible) continue
      const x = (n.x - bounds.minX) * scale
      const y = (n.y - bounds.minY) * scale
      const w = Math.max(1, n.width * scale)
      const h = Math.max(1, n.height * scale)
      const accent = ACCENT_HEX[n.meta?.accent ?? 'slate']
      ctx.fillStyle = accent.border
      ctx.globalAlpha = 0.75
      ctx.fillRect(x, y, w, h)
    }
    ctx.globalAlpha = 1

    // Viewport rectangle
    const vx = ((-viewport.x / viewport.scale) - bounds.minX) * scale
    const vy = ((-viewport.y / viewport.scale) - bounds.minY) * scale
    const vw = (containerWidth / viewport.scale) * scale
    const vh = (containerHeight / viewport.scale) * scale
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    ctx.strokeRect(vx, vy, vw, vh)
    ctx.fillStyle = 'rgba(56,189,248,0.10)'
    ctx.fillRect(vx, vy, vw, vh)
  }, [nodes, viewport, containerWidth, containerHeight, bounds, scale])

  const handlePointer = React.useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = e.clientX - rect.left
    const localY = e.clientY - rect.top
    const worldX = bounds.minX + localX / scale
    const worldY = bounds.minY + localY / scale
    onCentreOn(worldX, worldY)
  }, [bounds, scale, onCentreOn])

  return (
    <div className="rounded-md border border-border/70 bg-[#0a0f18] p-1 shadow-lg">
      <div className="mb-1 flex items-center justify-between px-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        <span>Minimap</span>
        <span className="font-mono">{Math.round(viewport.scale * 100)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        className="cursor-crosshair rounded-sm"
      />
    </div>
  )
}
