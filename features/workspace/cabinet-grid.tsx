'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Maximize2, Minus, Plus } from 'lucide-react'
import type { CabinetLayout, ScreenGeometryResult } from '@/engineering-engine'

interface Props {
  geometry?: ScreenGeometryResult
  cabinet?: CabinetLayout
  className?: string
  height?: number
}

/**
 * Cabinet Grid — a custom SVG cabinet visualiser designed to be a flagship
 * visualisation for ScreenLink.ai.
 *
 * Feature set (Release 0.5):
 *   - Renders every cabinet with row + column numbers.
 *   - Shows unused edge strips clearly (usedWidth < screenWidth).
 *   - Symmetric outline of the actual screen bounding box.
 *   - Wheel-zoom, drag-pan, and one-click "Fit".
 *
 * Extension seams reserved (Release 0.6+):
 *   - Cabinet selection state (onClick returns cabinet id)
 *   - Drag-and-drop cabinet rearrangement
 *   - Annotation layer (dimensions, arrows, notes)
 *   - Cabinet replacement UI
 *
 * The implementation avoids third-party visualisation libraries.
 */
export function CabinetGrid({ geometry, cabinet, className, height = 420 }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 800, h: height })

  React.useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: height }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: height })
    return () => ro.disconnect()
  }, [height])

  // View state (SVG viewport transform)
  const [scale, setScale] = React.useState(1)
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRef = React.useRef<{ dragging: boolean; x: number; y: number; ox: number; oy: number }>({ dragging: false, x: 0, y: 0, ox: 0, oy: 0 })

  const fit = React.useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }) }, [])

  // Zoom around the cursor
  const onWheel = React.useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    setScale((s) => clamp(s * (1 + delta), 0.25, 8))
  }, [])

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { dragging: true, x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y }
  }
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current.dragging) return
    setPan({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    })
  }
  const endDrag = () => { dragRef.current.dragging = false }

  const view = React.useMemo(() => computeView(size, geometry, cabinet), [size, geometry, cabinet])

  if (!geometry || !cabinet) {
    return (
      <div
        ref={containerRef}
        className={cn('flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground', className)}
        style={{ height }}
      >
        Add screen dimensions, pixel pitch and cabinet size to render the cabinet layout.
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden rounded-md border border-border bg-muted/10', className)} style={{ height }}>
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        style={{ cursor: dragRef.current.dragging ? 'grabbing' : 'grab', display: 'block', touchAction: 'none' }}
      >
        <defs>
          <pattern id="grid-bg" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={size.w} height={size.h} fill="url(#grid-bg)" />

        {/* Zoom + pan group */}
        <g transform={`translate(${size.w / 2 + pan.x} ${size.h / 2 + pan.y}) scale(${scale})`}>
          {/* Screen outline (real bounding box) */}
          <rect
            x={-view.screenWpx / 2}
            y={-view.screenHpx / 2}
            width={view.screenWpx}
            height={view.screenHpx}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeDasharray="4 3"
            strokeWidth={1}
          />

          {/* Used area (cabinet grid) */}
          <rect
            x={-view.usedWpx / 2}
            y={-view.usedHpx / 2}
            width={view.usedWpx}
            height={view.usedHpx}
            fill="hsl(210 90% 55% / 0.05)"
          />

          {/* Cabinets */}
          {Array.from({ length: cabinet.verticalCount }).map((_, row) =>
            Array.from({ length: cabinet.horizontalCount }).map((_, col) => {
              const x = -view.usedWpx / 2 + col * view.cabWpx
              const y = -view.usedHpx / 2 + row * view.cabHpx
              return (
                <g key={`${row}-${col}`}>
                  <rect
                    x={x} y={y}
                    width={view.cabWpx} height={view.cabHpx}
                    fill="hsl(210 90% 55% / 0.08)"
                    stroke="hsl(210 90% 55%)"
                    strokeOpacity={0.65}
                    strokeWidth={0.75}
                  />
                  {view.cabWpx > 30 && view.cabHpx > 20 && (
                    <text
                      x={x + view.cabWpx / 2}
                      y={y + view.cabHpx / 2 + 3}
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                      fontSize={Math.min(9, view.cabWpx / 5)}
                      fill="currentColor"
                      opacity={0.7}
                    >
                      R{row + 1}C{col + 1}
                    </text>
                  )}
                </g>
              )
            }),
          )}

          {/* Unused edge strips visualised */}
          {cabinet.unusedAreaSqM > 0 && (
            <>
              <UnusedStrips view={view} />
            </>
          )}

          {/* Center cross */}
          <line x1={-view.screenWpx / 2} y1={0} x2={view.screenWpx / 2} y2={0} stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.5} />
          <line x1={0} y1={-view.screenHpx / 2} x2={0} y2={view.screenHpx / 2} stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.5} />
        </g>
      </svg>

      {/* Toolbar */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 rounded-md border border-border bg-background/95 p-1 shadow-sm backdrop-blur">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => clamp(s * 1.2, 0.25, 8))} title="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => clamp(s / 1.2, 0.25, 8))} title="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fit} title="Fit">
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Metrics overlay */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-2 text-[10px] font-medium text-muted-foreground">
        <span className="rounded bg-background/80 px-2 py-1 shadow-sm backdrop-blur">
          {cabinet.horizontalCount} × {cabinet.verticalCount} · {cabinet.totalCabinets} cabinets
        </span>
        <span className="rounded bg-background/80 px-2 py-1 shadow-sm backdrop-blur">
          efficiency <span className="font-mono">{cabinet.efficiencyPercent}%</span>
        </span>
        <span className="rounded bg-background/80 px-2 py-1 shadow-sm backdrop-blur">
          zoom <span className="font-mono">{(scale * 100).toFixed(0)}%</span>
        </span>
      </div>
    </div>
  )
}

function UnusedStrips({ view }: { view: ReturnType<typeof computeView> }) {
  const gapW = view.screenWpx - view.usedWpx
  const gapH = view.screenHpx - view.usedHpx
  return (
    <g fill="hsl(0 80% 55% / 0.10)" stroke="hsl(0 80% 55%)" strokeOpacity={0.35} strokeWidth={0.5} strokeDasharray="3 2">
      {gapW > 0 && (
        <rect x={view.usedWpx / 2} y={-view.screenHpx / 2} width={gapW / 2} height={view.screenHpx} />
      )}
      {gapW > 0 && (
        <rect x={-view.screenWpx / 2} y={-view.screenHpx / 2} width={gapW / 2} height={view.screenHpx} />
      )}
      {gapH > 0 && (
        <rect x={-view.usedWpx / 2} y={view.usedHpx / 2} width={view.usedWpx} height={gapH / 2} />
      )}
      {gapH > 0 && (
        <rect x={-view.usedWpx / 2} y={-view.screenHpx / 2} width={view.usedWpx} height={gapH / 2} />
      )}
    </g>
  )
}

function computeView(
  size: { w: number; h: number },
  geometry?: ScreenGeometryResult,
  cabinet?: CabinetLayout,
) {
  if (!geometry || !cabinet) return { screenWpx: 0, screenHpx: 0, usedWpx: 0, usedHpx: 0, cabWpx: 0, cabHpx: 0, mmPerPx: 1 }
  const padding = 40
  const maxW = size.w - padding * 2
  const maxH = size.h - padding * 2
  const mmPerPx = Math.max(geometry.widthMm / maxW, geometry.heightMm / maxH, 0.0001)
  const screenWpx = geometry.widthMm / mmPerPx
  const screenHpx = geometry.heightMm / mmPerPx
  const cabWpx = cabinet.cabinetWidthMm / mmPerPx
  const cabHpx = cabinet.cabinetHeightMm / mmPerPx
  const usedWpx = cabWpx * cabinet.horizontalCount
  const usedHpx = cabHpx * cabinet.verticalCount
  return { screenWpx, screenHpx, usedWpx, usedHpx, cabWpx, cabHpx, mmPerPx }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
