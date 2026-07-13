'use client'

/**
 * Sprint 7 — Bottom status bar.
 *
 * Slim (24px) strip at the bottom of the canvas showing live workspace state:
 * cursor world-position, selection count, snap/grid/rulers status, hover
 * object name, and total-object counter. Read-only — clicks on badges
 * dispatch toggles through the store so the bar doubles as quick access.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { Magnet, Grid3x3, Ruler, Layers, MousePointer, Focus, ArrowUpDown } from 'lucide-react'
import { formatZoomPercent } from '../viewport-math'
import { cn } from '@/lib/utils'

interface Props { cursor: { x: number; y: number } | null }

function Badge({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick?: () => void; icon: React.ElementType; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition',
        active ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-muted/40',
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  )
}

export function BottomStatusBar({ cursor }: Props) {
  const viewport       = useWorkspaceStore((s) => s.viewport)
  const nodes          = useWorkspaceStore((s) => s.nodes)
  const layers         = useWorkspaceStore((s) => s.layers)
  const selectedIds    = useWorkspaceStore((s) => s.selectedIds)
  const hoverId        = useWorkspaceStore((s) => s.hoverId)
  const snapEnabled    = useWorkspaceStore((s) => s.snapEnabled)
  const gridVisible    = useWorkspaceStore((s) => s.gridVisible)
  const rulersVisible  = useWorkspaceStore((s) => s.rulersVisible)
  const spacePressed   = useWorkspaceStore((s) => s.spacePressed)
  const toggleSnap     = useWorkspaceStore((s) => s.toggleSnap)
  const toggleGrid     = useWorkspaceStore((s) => s.toggleGrid)
  const toggleRulers   = useWorkspaceStore((s) => s.toggleRulers)

  const hoverName = hoverId ? nodes.find((n) => n.id === hoverId)?.name : undefined

  return (
    <div className="flex h-6 items-center justify-between border-t border-border bg-card/70 px-3 text-[10px] font-mono text-muted-foreground backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <MousePointer className="h-3 w-3" />
          {cursor ? `${Math.round(cursor.x)}mm, ${Math.round(cursor.y)}mm` : '—'}
        </span>
        <span className="flex items-center gap-1">
          <Focus className="h-3 w-3" /> {formatZoomPercent(viewport.scale)}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" /> x:{Math.round(viewport.x)} y:{Math.round(viewport.y)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {hoverName && <span className="max-w-[180px] truncate text-foreground">↖ {hoverName}</span>}
        <span>
          <span className="text-foreground">{selectedIds.length}</span>
          <span className="mx-1">/</span>
          <span className="text-foreground">{nodes.length}</span>
          <span className="ml-1">selected</span>
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" /> {layers.length}
        </span>

        {spacePressed && (
          <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
            Space · Pan
          </span>
        )}

        <Badge active={snapEnabled}   onClick={toggleSnap}   icon={Magnet}  label="Snap" />
        <Badge active={gridVisible}   onClick={toggleGrid}   icon={Grid3x3} label="Grid" />
        <Badge active={rulersVisible} onClick={toggleRulers} icon={Ruler}   label="Rulers" />
      </div>
    </div>
  )
}
