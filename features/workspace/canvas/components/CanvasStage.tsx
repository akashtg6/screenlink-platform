'use client'

/**
 * Sprint 6A — Konva Stage.
 *
 * Renders the infinite engineering canvas: grid background, nodes, marquee
 * selection, and Konva.Transformer for resize/rotate handles. Handles pan,
 * zoom, drag-drop of new nodes from the toolbox, and marquee selection.
 */

import * as React from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useWorkspaceStore } from '../store'
import { findCatalog } from '../catalog'
import {
  GRID_MAJOR, GRID_MAJOR_EVERY, GRID_MINOR, GRID_STEP,
  MARQUEE_FILL, MARQUEE_STROKE, SNAP_STEP, ZOOM_STEP,
} from '../constants'
import { intersectsRect, snapValue } from '../engine'
import type { WorkspaceNode } from '../types'
import { CabinetShape } from './CabinetShape'

interface Props {
  onReady?: (api: { fitToScreen: () => void }) => void
}

interface Size { w: number; h: number }

export default function CanvasStage({ onReady }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const stageRef = React.useRef<Konva.Stage | null>(null)
  const transformerRef = React.useRef<Konva.Transformer | null>(null)

  const [size, setSize] = React.useState<Size>({ w: 800, h: 600 })
  const [marquee, setMarquee] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const marqueeStart = React.useRef<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = React.useState(false)
  const panStart = React.useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const [cursorWorld, setCursorWorld] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const nodes = useWorkspaceStore((s) => s.nodes)
  const layers = useWorkspaceStore((s) => s.layers)
  const selectedIds = useWorkspaceStore((s) => s.selectedIds)
  const viewport = useWorkspaceStore((s) => s.viewport)
  const gridVisible = useWorkspaceStore((s) => s.gridVisible)
  const snapEnabled = useWorkspaceStore((s) => s.snapEnabled)
  const setViewport = useWorkspaceStore((s) => s.setViewport)
  const zoomAt = useWorkspaceStore((s) => s.zoomAt)
  const selectOne = useWorkspaceStore((s) => s.selectOne)
  const selectMany = useWorkspaceStore((s) => s.selectMany)
  const clearSelection = useWorkspaceStore((s) => s.clearSelection)
  const updateNode = useWorkspaceStore((s) => s.updateNode)
  const addFromCatalog = useWorkspaceStore((s) => s.addFromCatalog)
  const fitToScreen = useWorkspaceStore((s) => s.fitToScreen)

  const lockedLayers = React.useMemo(
    () => new Set(layers.filter((l) => l.locked || !l.visible).map((l) => l.id)),
    [layers],
  )
  const hiddenLayers = React.useMemo(
    () => new Set(layers.filter((l) => !l.visible).map((l) => l.id)),
    [layers],
  )

  /* -------- container size ----------------------------------------- */
  React.useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      setSize({ w: rect.width, h: rect.height })
    })
    ro.observe(el)
    const rect = el.getBoundingClientRect()
    setSize({ w: rect.width, h: rect.height })
    return () => ro.disconnect()
  }, [])

  /* -------- report API for parent (Fit To Screen) ------------------ */
  React.useEffect(() => {
    onReady?.({
      fitToScreen: () => fitToScreen(size.w, size.h),
    })
  }, [onReady, fitToScreen, size.w, size.h])

  /* -------- centre origin on first mount --------------------------- */
  const hasCentered = React.useRef(false)
  React.useEffect(() => {
    if (hasCentered.current) return
    if (size.w < 10 || size.h < 10) return
    hasCentered.current = true
    if (viewport.x === 0 && viewport.y === 0 && viewport.scale === 1 && nodes.length === 0) {
      setViewport({ x: size.w / 2, y: size.h / 2 })
    }
  }, [size, viewport, nodes.length, setViewport])

  /* -------- attach transformer to selection ------------------------- */
  React.useEffect(() => {
    const stage = stageRef.current
    const tr = transformerRef.current
    if (!stage || !tr) return
    const shapes = selectedIds
      .map((id) => stage.findOne<Konva.Node>(`#${id}`))
      .filter((n): n is Konva.Node => !!n)
    tr.nodes(shapes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, nodes])

  /* -------- wheel zoom --------------------------------------------- */
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.evt.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
    zoomAt(e.evt.clientX, e.evt.clientY, factor, rect)
  }

  /* -------- panning ------------------------------------------------- */
  const startPan = (clientX: number, clientY: number) => {
    setIsPanning(true)
    panStart.current = { x: clientX, y: clientY, vx: viewport.x, vy: viewport.y }
  }
  const doPan = (clientX: number, clientY: number) => {
    if (!panStart.current) return
    const dx = clientX - panStart.current.x
    const dy = clientY - panStart.current.y
    setViewport({ x: panStart.current.vx + dx, y: panStart.current.vy + dy })
  }
  const endPan = () => {
    setIsPanning(false)
    panStart.current = null
  }

  /* -------- stage mouse ------------------------------------------- */
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const evt = e.evt
    const isMiddle = evt.button === 1
    const isSpacePan = evt.button === 0 && (evt.getModifierState?.('Space') || false)

    // Pan when middle-mouse or space-drag
    if (isMiddle || isSpacePan) {
      evt.preventDefault()
      startPan(evt.clientX, evt.clientY)
      return
    }

    // Left-click on empty stage → marquee or clear selection
    if (e.target === e.target.getStage()) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = evt.clientX - rect.left
      const py = evt.clientY - rect.top
      const worldX = (px - viewport.x) / viewport.scale
      const worldY = (py - viewport.y) / viewport.scale
      marqueeStart.current = { x: worldX, y: worldY }
      setMarquee({ x: worldX, y: worldY, w: 0, h: 0 })
      if (!evt.shiftKey) clearSelection()
    }
  }

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.evt.clientX - rect.left
    const py = e.evt.clientY - rect.top
    const worldX = (px - viewport.x) / viewport.scale
    const worldY = (py - viewport.y) / viewport.scale
    setCursorWorld({ x: worldX, y: worldY })

    if (isPanning) {
      doPan(e.evt.clientX, e.evt.clientY)
      return
    }
    if (marqueeStart.current) {
      const start = marqueeStart.current
      setMarquee({
        x: Math.min(start.x, worldX),
        y: Math.min(start.y, worldY),
        w: Math.abs(worldX - start.x),
        h: Math.abs(worldY - start.y),
      })
    }
  }

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) { endPan(); return }
    if (marqueeStart.current && marquee) {
      // Threshold: treat tiny marquees as a click (already cleared selection).
      if (marquee.w > 4 && marquee.h > 4) {
        const rect = { minX: marquee.x, minY: marquee.y, maxX: marquee.x + marquee.w, maxY: marquee.y + marquee.h }
        const hitIds = nodes
          .filter((n) => n.visible && !hiddenLayers.has(n.layerId) && intersectsRect(n, rect))
          .map((n) => n.id)
        selectMany(e.evt.shiftKey ? [...selectedIds, ...hitIds] : hitIds)
      }
      marqueeStart.current = null
      setMarquee(null)
    }
  }

  /* -------- drop from toolbox ------------------------------------- */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const catalogId = e.dataTransfer.getData('application/x-catalog-id')
    if (!catalogId) return
    const catalog = findCatalog(catalogId)
    if (!catalog) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const worldX = (px - viewport.x) / viewport.scale
    const worldY = (py - viewport.y) / viewport.scale
    addFromCatalog(catalog, worldX, worldY)
  }

  /* -------- node drag → store ------------------------------------- */
  const handleNodeDragEnd = React.useCallback((id: string, x: number, y: number) => {
    const nx = snapEnabled ? snapValue(x, SNAP_STEP) : x
    const ny = snapEnabled ? snapValue(y, SNAP_STEP) : y
    updateNode(id, { x: nx, y: ny })
  }, [snapEnabled, updateNode])

  /* -------- transformer transformend (rotate / resize) ------------- */
  const handleTransformEnd = () => {
    const tr = transformerRef.current
    if (!tr) return
    const trNodes = tr.nodes()
    for (const s of trNodes) {
      const scaleX = s.scaleX()
      const scaleY = s.scaleY()
      const id = s.id()
      const node = useWorkspaceStore.getState().nodes.find((n) => n.id === id)
      if (!node) continue
      const nw = Math.max(20, node.width * scaleX)
      const nh = Math.max(20, node.height * scaleY)
      updateNode(id, {
        x: s.x(),
        y: s.y(),
        width: snapEnabled ? snapValue(nw, SNAP_STEP) : nw,
        height: snapEnabled ? snapValue(nh, SNAP_STEP) : nh,
        rotation: s.rotation() % 360,
      })
      s.scaleX(1); s.scaleY(1)
    }
  }

  /* -------- grid style -------------------------------------------- */
  const gridSize = GRID_STEP * viewport.scale
  const majorSize = gridSize * GRID_MAJOR_EVERY
  const gridStyle: React.CSSProperties = gridVisible ? {
    backgroundImage: [
      `linear-gradient(to right, ${GRID_MINOR} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${GRID_MINOR} 1px, transparent 1px)`,
      `linear-gradient(to right, ${GRID_MAJOR} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${GRID_MAJOR} 1px, transparent 1px)`,
    ].join(', '),
    backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${majorSize}px ${majorSize}px, ${majorSize}px ${majorSize}px`,
    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
  } : {}

  /* -------- render ------------------------------------------------- */
  const sortedNodes = React.useMemo(() => {
    return [...nodes]
      .filter((n) => !hiddenLayers.has(n.layerId))
      .sort((a, b) => {
        const la = layers.find((l) => l.id === a.layerId)?.order ?? 0
        const lb = layers.find((l) => l.id === b.layerId)?.order ?? 0
        if (la !== lb) return la - lb
        return a.zIndex - b.zIndex
      })
  }, [nodes, layers, hiddenLayers])

  const cursorMm = { x: Math.round(cursorWorld.x), y: Math.round(cursorWorld.y) }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#0b0f16]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grabbing' : 'default', ...gridStyle }}
    >
      {size.w > 10 && size.h > 10 && (
        <Stage
          ref={(node) => { stageRef.current = node ?? null }}
          width={size.w}
          height={size.h}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={() => { if (isPanning) endPan(); marqueeStart.current = null; setMarquee(null) }}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer listening>
            {sortedNodes.map((n: WorkspaceNode) => (
              <CabinetShape
                key={n.id}
                node={n}
                selected={selectedIds.includes(n.id)}
                locked={n.locked || lockedLayers.has(n.layerId)}
                onSelect={selectOne}
                onDragEnd={handleNodeDragEnd}
                scale={viewport.scale}
              />
            ))}

            {marquee && (
              <Rect
                x={marquee.x}
                y={marquee.y}
                width={marquee.w}
                height={marquee.h}
                stroke={MARQUEE_STROKE}
                strokeWidth={1 / viewport.scale}
                fill={MARQUEE_FILL}
                dash={[6 / viewport.scale, 4 / viewport.scale]}
                listening={false}
              />
            )}

            <Transformer
              ref={(node) => { transformerRef.current = node ?? null }}
              rotateEnabled
              resizeEnabled
              keepRatio={false}
              anchorSize={9}
              borderStroke="#38bdf8"
              anchorStroke="#0ea5e9"
              anchorFill="#0f172a"
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) return oldBox
                return newBox
              }}
            />
          </Layer>
        </Stage>
      )}

      {/* Cursor readout */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white/80">
        x: {cursorMm.x}mm &nbsp; y: {cursorMm.y}mm
      </div>
    </div>
  )
}
