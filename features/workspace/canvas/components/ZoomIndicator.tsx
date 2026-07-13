'use client'

/**
 * Sprint 7 — Zoom indicator.
 *
 * Floating pill in the bottom-right of the canvas. Shows current zoom % and
 * opens a popover with preset zoom levels + Fit / Zoom-to-Selection / Reset.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { formatZoomPercent } from '../viewport-math'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Maximize2, Focus, RotateCcw } from 'lucide-react'

interface Props {
  containerWidth: number
  containerHeight: number
  hasSelection: boolean
}

const PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3] as const

export function ZoomIndicator({ containerWidth, containerHeight, hasSelection }: Props) {
  const viewport         = useWorkspaceStore((s) => s.viewport)
  const setZoom          = useWorkspaceStore((s) => s.setZoom)
  const fitToScreen      = useWorkspaceStore((s) => s.fitToScreen)
  const zoomToSelection  = useWorkspaceStore((s) => s.zoomToSelection)
  const resetViewport    = useWorkspaceStore((s) => s.resetViewport)

  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto flex h-7 min-w-[64px] items-center justify-center rounded-md border border-border/60 bg-black/60 px-3 font-mono text-[11px] font-medium text-foreground/90 shadow-lg backdrop-blur transition hover:bg-black/80"
          aria-label="Zoom level"
        >
          {formatZoomPercent(viewport.scale)}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-48 p-1">
        <div className="mb-1 px-2 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Zoom</div>
        <div className="grid grid-cols-3 gap-1 p-1">
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={Math.abs(viewport.scale - p) < 0.01 ? 'secondary' : 'ghost'}
              className="h-7 font-mono text-[11px]"
              onClick={() => { setZoom(p, containerWidth, containerHeight); setOpen(false) }}
            >
              {Math.round(p * 100)}%
            </Button>
          ))}
        </div>
        <div className="mt-1 border-t border-border pt-1">
          <Button size="sm" variant="ghost" className="h-7 w-full justify-start gap-2 text-[11px]"
                  onClick={() => { fitToScreen(containerWidth, containerHeight); setOpen(false) }}>
            <Maximize2 className="h-3.5 w-3.5" /> Fit to screen
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-full justify-start gap-2 text-[11px]"
                  disabled={!hasSelection}
                  onClick={() => { zoomToSelection(containerWidth, containerHeight); setOpen(false) }}>
            <Focus className="h-3.5 w-3.5" /> Zoom to selection
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-full justify-start gap-2 text-[11px]"
                  onClick={() => { resetViewport(); setOpen(false) }}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset view (100%)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
