'use client'

/**
 * Sprint 6A — Standalone Workspace playground.
 *
 * Mounts the full canvas UI without a Project or persistence. Useful for
 * design QA and screenshot capture. Not linked from any navigation — reach
 * it via the direct URL `/workspace-preview`.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'
import { Toolbox } from '@/features/workspace/canvas/components/Toolbox'
import { PropertiesPanel } from '@/features/workspace/canvas/components/PropertiesPanel'
import { LayersPanel } from '@/features/workspace/canvas/components/LayersPanel'
import { TopToolbar } from '@/features/workspace/canvas/components/TopToolbar'
import { MiniMap } from '@/features/workspace/canvas/components/MiniMap'
import { useWorkspaceStore } from '@/features/workspace/canvas'

const CanvasStage = dynamic(
  () => import('@/features/workspace/canvas/components/CanvasStage'),
  { ssr: false, loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0f16] text-sm text-muted-foreground">Loading canvas…</div>
  ) },
)

export default function WorkspacePreviewPage() {
  const canvasApi = React.useRef<{ fitToScreen: () => void } | null>(null)
  const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 })
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const nodes = useWorkspaceStore((s) => s.nodes)
  const viewport = useWorkspaceStore((s) => s.viewport)
  const setViewport = useWorkspaceStore((s) => s.setViewport)
  const hydrate = useWorkspaceStore((s) => s.hydrate)
  const dirty = useWorkspaceStore((s) => s.dirty)
  const markSaved = useWorkspaceStore((s) => s.markSaved)

  // Hydrate a demo layout once on mount.
  React.useEffect(() => {
    hydrate({
      version: 1,
      layers: [
        { id: 'L1', name: 'LED Wall',   visible: true, locked: false, order: 0 },
        { id: 'L2', name: 'AV Devices', visible: true, locked: false, order: 1 },
      ],
      nodes: [
        // 3x2 LED grid
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `n-led-${i}`,
          catalogId: 'absen-a3pro-500',
          category: 'led' as const,
          name: 'Absen A3 Pro',
          x: 200 + (i % 3) * 520,
          y: 200 + Math.floor(i / 3) * 520,
          width: 500, height: 500, rotation: 0,
          layerId: 'L1', locked: false, visible: true, zIndex: i, groupId: null,
          meta: { manufacturer: 'Absen', pixelPitchMm: 3.9, resolution: '128×128', accent: 'red' as const },
        })),
        // LCD panel
        { id: 'n-lcd', catalogId: 'samsung-qmb-55', category: 'lcd' as const, name: 'Samsung QM55B',
          x: 2000, y: 200, width: 1214, height: 684, rotation: 0,
          layerId: 'L2', locked: false, visible: true, zIndex: 0, groupId: null,
          meta: { manufacturer: 'Samsung', resolution: '3840×2160', accent: 'blue' as const } },
        // Rack
        { id: 'n-rack', catalogId: 'ph-rack-600', category: 'placeholder' as const, name: 'Equipment Rack',
          x: 2100, y: 1000, width: 600, height: 1000, rotation: 0,
          layerId: 'L2', locked: false, visible: true, zIndex: 1, groupId: null,
          meta: { manufacturer: 'Generic', accent: 'slate' as const } },
      ],
      viewport: { x: 100, y: 60, scale: 0.28 },
      updatedAt: new Date().toISOString(),
    })
    markSaved(new Date().toISOString())
  }, [hydrate, markSaved])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setContainerSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    const r = el.getBoundingClientRect()
    setContainerSize({ w: r.width, h: r.height })
    return () => ro.disconnect()
  }, [])

  const centreOn = React.useCallback((worldX: number, worldY: number) => {
    setViewport({
      x: containerSize.w / 2 - worldX * viewport.scale,
      y: containerSize.h / 2 - worldY * viewport.scale,
    })
  }, [containerSize.w, containerSize.h, viewport.scale, setViewport])

  const noop = React.useCallback(() => {}, [])
  const fit = React.useCallback(() => canvasApi.current?.fitToScreen(), [])

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <div className="flex h-10 items-center justify-between border-b border-border bg-card/70 px-3 text-xs">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Workspace Preview · <span className="text-foreground">Sandbox mode</span>
        </div>
        <div className="text-[10px] text-muted-foreground">No project attached. Nothing is saved.</div>
      </div>
      <TopToolbar
        saveStatus="idle"
        lastSavedAt={null}
        dirty={dirty}
        onSave={noop}
        onFit={fit}
        onOpenSummary={noop}
      />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={16} minSize={12} maxSize={24}>
            <Toolbox />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={62} minSize={40}>
            <div ref={containerRef} className="relative h-full w-full">
              <CanvasStage onReady={(api) => { canvasApi.current = api }} />
              <div className="pointer-events-none absolute bottom-3 right-3">
                <div className="pointer-events-auto">
                  <MiniMap
                    nodes={nodes}
                    viewport={viewport}
                    containerWidth={containerSize.w}
                    containerHeight={containerSize.h}
                    onCentreOn={centreOn}
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border/60 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                <span className="mr-2 text-foreground">{nodes.length}</span>objects
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={22} minSize={16} maxSize={30}>
            <div className="flex h-full flex-col border-l border-border bg-card/60 backdrop-blur">
              <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Properties
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <PropertiesPanel />
              </div>
              <div className="h-[45%] min-h-[200px] border-t border-border">
                <LayersPanel />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
