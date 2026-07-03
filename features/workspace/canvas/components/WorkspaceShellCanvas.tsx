'use client'

/**
 * Sprint 6A — Workspace Shell.
 *
 * Composes the full-screen engineering canvas UI: top toolbar, left toolbox,
 * centre canvas + minimap, right properties inspector + layers panel. Also
 * owns the "Engineering Summary" side sheet (backwards-compat with the
 * previous, calculation-focused workspace view).
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { Project } from '@/types'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toolbox } from './Toolbox'
import { PropertiesPanel } from './PropertiesPanel'
import { LayersPanel } from './LayersPanel'
import { TopToolbar } from './TopToolbar'
import { MiniMap } from './MiniMap'
import { useWorkspaceStore } from '../store'
import { useWorkspacePersistence } from '../use-workspace-persistence'
import { useCanvasHotkeys } from '../use-canvas-hotkeys'
import { WorkspaceProvider } from '../../workspace-provider'
import { EngineeringWorkspace } from '../../engineering-workspace'
import { toast } from 'sonner'

const CanvasStage = dynamic(() => import('./CanvasStage'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0f16] text-muted-foreground text-sm">
      Loading canvas…
    </div>
  ),
})

interface Props {
  project: Project
}

export function WorkspaceShellCanvas({ project }: Props) {
  const { status, lastSavedAt, dirty, saveNow } = useWorkspacePersistence(project)

  const canvasApi = React.useRef<{ fitToScreen: () => void } | null>(null)
  const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 })
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const nodes = useWorkspaceStore((s) => s.nodes)
  const viewport = useWorkspaceStore((s) => s.viewport)
  const setViewport = useWorkspaceStore((s) => s.setViewport)

  const [showSummary, setShowSummary] = React.useState(false)

  const handleSave = React.useCallback(async () => {
    await saveNow()
    if (useWorkspaceStore.getState().dirty === false) {
      toast.success('Workspace saved')
    }
  }, [saveNow])

  const handleFit = React.useCallback(() => {
    canvasApi.current?.fitToScreen()
  }, [])

  useCanvasHotkeys({ onSave: handleSave, onFit: handleFit })

  // Track the canvas container size for the minimap viewport rectangle.
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

  const centreViewportOn = React.useCallback((worldX: number, worldY: number) => {
    setViewport({
      x: containerSize.w / 2 - worldX * viewport.scale,
      y: containerSize.h / 2 - worldY * viewport.scale,
    })
  }, [containerSize.w, containerSize.h, viewport.scale, setViewport])

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-lg border border-border bg-[#0b0f16]">
      <TopToolbar
        saveStatus={status}
        lastSavedAt={lastSavedAt}
        dirty={dirty}
        onSave={handleSave}
        onFit={handleFit}
        onOpenSummary={() => setShowSummary(true)}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: Toolbox */}
          <ResizablePanel defaultSize={16} minSize={12} maxSize={24}>
            <Toolbox />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Centre: Canvas */}
          <ResizablePanel defaultSize={62} minSize={40}>
            <div ref={containerRef} className="relative h-full w-full">
              <CanvasStage onReady={(api) => { canvasApi.current = api }} />
              {/* MiniMap floating in the bottom-right corner */}
              <div className="pointer-events-none absolute bottom-3 right-3">
                <div className="pointer-events-auto">
                  <MiniMap
                    nodes={nodes}
                    viewport={viewport}
                    containerWidth={containerSize.w}
                    containerHeight={containerSize.h}
                    onCentreOn={centreViewportOn}
                  />
                </div>
              </div>
              <NodeCounter />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right: Inspector + Layers */}
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

      {/* Engineering Summary side sheet (legacy calculation view) */}
      <Sheet open={showSummary} onOpenChange={setShowSummary}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Engineering summary</SheetTitle>
          </SheetHeader>
          <WorkspaceProvider project={project}>
            <EngineeringWorkspace />
          </WorkspaceProvider>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function NodeCounter() {
  const nodes = useWorkspaceStore((s) => s.nodes)
  const selectedIds = useWorkspaceStore((s) => s.selectedIds)
  const layers = useWorkspaceStore((s) => s.layers)
  return (
    <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border/60 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
      <span className="mr-2 text-foreground">{nodes.length}</span>objects
      <span className="mx-2 text-border">│</span>
      <span className="mr-2 text-foreground">{selectedIds.length}</span>selected
      <span className="mx-2 text-border">│</span>
      <span className="mr-2 text-foreground">{layers.length}</span>layers
    </div>
  )
}
