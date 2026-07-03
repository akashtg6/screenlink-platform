'use client'

/**
 * Sprint 6A — Properties Inspector (right sidebar top).
 *
 * When exactly one node is selected: shows all editable properties bound to
 * the store's `updateNode`. When multiple are selected: shows only shared
 * batch operations (rotation, lock/hide, alignment shortcut hint). When none
 * is selected: shows an empty state.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { MousePointerSquareDashed, Lock, Eye, EyeOff, LockOpen } from 'lucide-react'

function NumberField({
  label, value, onChange, step = 1, min, max, suffix,
}: {
  label: string; value: number; onChange: (v: number) => void
  step?: number; min?: number; max?: number; suffix?: string
}) {
  const [text, setText] = React.useState(String(Math.round(value * 100) / 100))
  React.useEffect(() => { setText(String(Math.round(value * 100) / 100)) }, [value])

  const commit = () => {
    const parsed = Number(text)
    if (Number.isFinite(parsed)) {
      let v = parsed
      if (min != null) v = Math.max(min, v)
      if (max != null) v = Math.min(max, v)
      onChange(v)
    } else {
      setText(String(Math.round(value * 100) / 100))
    }
  }

  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        <Input
          type="number"
          step={step}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
          className="h-8 pr-8 font-mono text-xs"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function PropertiesPanel() {
  const nodes = useWorkspaceStore((s) => s.nodes)
  const layers = useWorkspaceStore((s) => s.layers)
  const selectedIds = useWorkspaceStore((s) => s.selectedIds)
  const updateNode = useWorkspaceStore((s) => s.updateNode)
  const updateSelected = useWorkspaceStore((s) => s.updateSelected)

  const selected = React.useMemo(
    () => nodes.filter((n) => selectedIds.includes(n.id)),
    [nodes, selectedIds],
  )

  if (selected.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
        <MousePointerSquareDashed className="h-6 w-6 opacity-60" />
        <div className="text-xs font-medium">No selection</div>
        <p className="text-[11px] leading-4">Select a cabinet on the canvas to edit its properties. Shift-click for multi-select.</p>
      </div>
    )
  }

  if (selected.length > 1) {
    return (
      <div className="space-y-4 p-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selection</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{selected.length} objects</div>
        </div>
        <Separator />
        <NumberField
          label="Rotation Δ"
          value={0}
          onChange={(v) => updateSelected({ rotation: v })}
          step={15}
          suffix="°"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
            onClick={() => updateSelected({ locked: true })}
          >
            <Lock className="mr-1 inline h-3 w-3" /> Lock all
          </button>
          <button
            className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
            onClick={() => updateSelected({ locked: false })}
          >
            <LockOpen className="mr-1 inline h-3 w-3" /> Unlock all
          </button>
          <button
            className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
            onClick={() => updateSelected({ visible: false })}
          >
            <EyeOff className="mr-1 inline h-3 w-3" /> Hide
          </button>
          <button
            className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
            onClick={() => updateSelected({ visible: true })}
          >
            <Eye className="mr-1 inline h-3 w-3" /> Show
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Use the top toolbar for alignment / distribution / z-order operations on the current selection.</p>
      </div>
    )
  }

  const node = selected[0]
  const layerName = layers.find((l) => l.id === node.layerId)?.name ?? '—'

  return (
    <div className="space-y-3 p-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {node.category.toUpperCase()} — {node.meta?.manufacturer ?? '—'}
        </div>
        <Input
          value={node.name}
          onChange={(e) => updateNode(node.id, { name: e.target.value })}
          className="mt-1 h-8 text-sm font-semibold"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width"    value={node.width}    onChange={(v) => updateNode(node.id, { width: Math.max(20, v) })} suffix="mm" />
        <NumberField label="Height"   value={node.height}   onChange={(v) => updateNode(node.id, { height: Math.max(20, v) })} suffix="mm" />
        <NumberField label="Position X" value={node.x} onChange={(v) => updateNode(node.id, { x: v })} suffix="mm" />
        <NumberField label="Position Y" value={node.y} onChange={(v) => updateNode(node.id, { y: v })} suffix="mm" />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Rotation</Label>
        <div className="mt-2 flex items-center gap-3">
          <Slider
            min={0}
            max={359}
            step={1}
            value={[node.rotation]}
            onValueChange={([v]) => updateNode(node.id, { rotation: v })}
            className="flex-1"
          />
          <span className="w-10 text-right font-mono text-[11px] text-foreground">{Math.round(node.rotation)}°</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            {node.locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />} Locked
          </Label>
          <Switch checked={node.locked} onCheckedChange={(v) => updateNode(node.id, { locked: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            {node.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Visible
          </Label>
          <Switch checked={node.visible} onCheckedChange={(v) => updateNode(node.id, { visible: v })} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
        <div>
          <div className="uppercase tracking-wider">Layer</div>
          <div className="mt-0.5 font-medium text-foreground">{layerName}</div>
        </div>
        {node.meta?.pixelPitchMm != null && (
          <div>
            <div className="uppercase tracking-wider">Pixel pitch</div>
            <div className="mt-0.5 font-mono text-foreground">{node.meta.pixelPitchMm} mm</div>
          </div>
        )}
        {node.meta?.resolution && (
          <div>
            <div className="uppercase tracking-wider">Resolution</div>
            <div className="mt-0.5 font-mono text-foreground">{node.meta.resolution}</div>
          </div>
        )}
        <div>
          <div className="uppercase tracking-wider">Z-index</div>
          <div className="mt-0.5 font-mono text-foreground">{Math.round(node.zIndex)}</div>
        </div>
      </div>
    </div>
  )
}
