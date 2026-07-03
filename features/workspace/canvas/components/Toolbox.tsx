'use client'

/**
 * Sprint 6A — Engineering Toolbox (left sidebar).
 *
 * Categorised list of catalog items with a tiny preview swatch. Cards are
 * HTML5-draggable; the CanvasStage picks up `application/x-catalog-id` on drop.
 */

import * as React from 'react'
import { CABINET_CATALOG, CATEGORY_LABEL, catalogByCategory } from '../catalog'
import { useWorkspaceStore } from '../store'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Layers, Search, Ruler } from 'lucide-react'
import type { CabinetCatalogItem, CabinetCategory } from '../types'
import { ACCENT_HEX } from '../constants'

export function Toolbox() {
  const [query, setQuery] = React.useState('')
  const grouped = React.useMemo(() => catalogByCategory(), [])
  const addFromCatalog = useWorkspaceStore((s) => s.addFromCatalog)
  const viewport = useWorkspaceStore((s) => s.viewport)

  const filtered = React.useMemo(() => {
    if (!query.trim()) return grouped
    const q = query.toLowerCase()
    const filter = (list: CabinetCatalogItem[]) =>
      list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.manufacturer.toLowerCase().includes(q) ||
        (c.tag ?? '').toLowerCase().includes(q),
      )
    return {
      led: filter(grouped.led),
      lcd: filter(grouped.lcd),
      placeholder: filter(grouped.placeholder),
    } as Record<CabinetCategory, CabinetCatalogItem[]>
  }, [grouped, query])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('application/x-catalog-id', id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDoubleClick = (item: CabinetCatalogItem) => {
    // Place at current viewport centre so double-click is discoverable even
    // if the user doesn't know about drag & drop.
    const worldX = -viewport.x / viewport.scale + 400
    const worldY = -viewport.y / viewport.scale + 300
    addFromCatalog(item, worldX, worldY)
  }

  return (
    <aside className="flex h-full w-64 flex-none flex-col border-r border-border bg-card/60 backdrop-blur">
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> Engineering Toolbox
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog…"
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {(['led', 'lcd', 'placeholder'] as CabinetCategory[]).map((cat) => {
            const list = filtered[cat]
            if (!list || list.length === 0) return null
            return (
              <div key={cat} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-mono">{list.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {list.map((item) => (
                    <CatalogCard
                      key={item.id}
                      item={item}
                      onDragStart={handleDragStart}
                      onDoubleClick={handleDoubleClick}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          <div className="mt-4 rounded-md border border-dashed border-border/60 bg-muted/10 p-2 text-[10px] leading-4 text-muted-foreground">
            <div className="flex items-center gap-1 font-semibold text-foreground/70">
              <Ruler className="h-3 w-3" /> How to place
            </div>
            <ul className="mt-1 space-y-0.5">
              <li>• Drag a card onto the canvas</li>
              <li>• Double-click to drop at centre</li>
              <li>• All units are millimetres</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}

interface CardProps {
  item: CabinetCatalogItem
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void
  onDoubleClick: (item: CabinetCatalogItem) => void
}
function CatalogCard({ item, onDragStart, onDoubleClick }: CardProps) {
  const palette = ACCENT_HEX[item.accent]
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDoubleClick={() => onDoubleClick(item)}
      className="group cursor-grab select-none rounded-md border border-border/70 bg-card p-2 transition hover:border-accent hover:bg-accent/5 active:cursor-grabbing"
      title={`${item.manufacturer} · ${item.widthMm}×${item.heightMm}mm`}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-10 flex-none items-center justify-center rounded border text-[9px] font-bold uppercase"
          style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
        >
          {item.category === 'led' ? 'LED' : item.category === 'lcd' ? 'LCD' : 'PH'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-foreground">{item.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{item.manufacturer}</span>
            <span>·</span>
            <span className="font-mono">{item.widthMm}×{item.heightMm}</span>
          </div>
        </div>
      </div>
      {item.tag && (
        <div className="mt-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">{item.tag}</div>
      )}
    </div>
  )
}
