'use client'

/**
 * Sprint 6A — Layers Panel (right sidebar bottom).
 *
 * Provides rename / hide / show / lock / unlock / reorder / delete for layers.
 * The topmost layer in the list corresponds to the highest `order` (drawn on
 * top on the canvas), matching Figma/Photoshop conventions.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LayersPanel() {
  const layers = useWorkspaceStore((s) => s.layers)
  const activeLayerId = useWorkspaceStore((s) => s.activeLayerId)
  const nodes = useWorkspaceStore((s) => s.nodes)
  const addLayer = useWorkspaceStore((s) => s.addLayer)
  const renameLayer = useWorkspaceStore((s) => s.renameLayer)
  const toggleLayerVisibility = useWorkspaceStore((s) => s.toggleLayerVisibility)
  const toggleLayerLock = useWorkspaceStore((s) => s.toggleLayerLock)
  const reorderLayer = useWorkspaceStore((s) => s.reorderLayer)
  const deleteLayer = useWorkspaceStore((s) => s.deleteLayer)
  const setActiveLayer = useWorkspaceStore((s) => s.setActiveLayer)

  // Display top-first (highest order first).
  const ordered = React.useMemo(
    () => [...layers].sort((a, b) => b.order - a.order),
    [layers],
  )

  const nodeCounts = React.useMemo(() => {
    const c: Record<string, number> = {}
    for (const n of nodes) c[n.layerId] = (c[n.layerId] ?? 0) + 1
    return c
  }, [nodes])

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingValue, setEditingValue] = React.useState('')

  const startRename = (id: string, current: string) => {
    setEditingId(id)
    setEditingValue(current)
  }
  const commitRename = () => {
    if (editingId) renameLayer(editingId, editingValue.trim() || 'Layer')
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> Layers
        </div>
        <button
          onClick={() => addLayer()}
          className="rounded-md border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
          title="Add layer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-1">
        {ordered.map((layer, i) => {
          const isActive = layer.id === activeLayerId
          const count = nodeCounts[layer.id] ?? 0
          const topmostIndex = 0
          const bottommostIndex = ordered.length - 1
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={cn(
                'group mb-1 flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs',
                isActive
                  ? 'border-accent/50 bg-accent/10 text-foreground'
                  : 'border-transparent text-foreground/85 hover:bg-muted/40',
              )}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id) }}
                className="p-0.5 text-muted-foreground hover:text-foreground"
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-60" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id) }}
                className="p-0.5 text-muted-foreground hover:text-foreground"
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 opacity-60" />}
              </button>

              <div className="min-w-0 flex-1">
                {editingId === layer.id ? (
                  <Input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename() }}
                    className="h-6 px-1 text-xs"
                  />
                ) : (
                  <button
                    onDoubleClick={() => startRename(layer.id, layer.name)}
                    className="block w-full truncate text-left"
                  >
                    {layer.name}
                  </button>
                )}
              </div>

              <span className="mr-1 font-mono text-[10px] text-muted-foreground">{count}</span>

              <div className="opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, layer.order + 1) }}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={i === topmostIndex}
                  title="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, layer.order - 1) }}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={i === bottommostIndex}
                  title="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id) }}
                  className="p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  disabled={layers.length <= 1}
                  title="Delete layer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
