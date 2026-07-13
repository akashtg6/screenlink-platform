'use client'

/**
 * Sprint 6A — Top toolbar.
 *
 * Alignment, distribute, z-order, group/ungroup, undo/redo, save + status
 * indicator, zoom controls, fit / reset, snap + grid toggles.
 */

import * as React from 'react'
import { useWorkspaceStore } from '../store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignLeft, AlignRight, AlignHorizontalJustifyStart, AlignHorizontalJustifyEnd,
  BringToFront, SendToBack, ChevronsUp, ChevronsDown,
  Copy, ClipboardPaste, Group, Ungroup, Undo2, Redo2,
  RotateCcw, RotateCw, Save, Grid3x3, Magnet, Maximize2,
  ZoomIn, ZoomOut, Loader2, Check, AlertCircle, Trash2,
  Sparkles, Ruler, Map, Focus, RefreshCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceSaveStatus } from '../use-workspace-persistence'

interface Props {
  saveStatus: WorkspaceSaveStatus
  lastSavedAt: string | null
  dirty: boolean
  onSave: () => void
  onFit: () => void
  onZoomToSelection: () => void
  onOpenSummary: () => void
}

function IconBtn({
  label, onClick, children, disabled, className,
}: {
  label: string; onClick?: () => void; children: React.ReactNode; disabled?: boolean; className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn('h-7 w-7', className)}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
    </Tooltip>
  )
}

export function TopToolbar({ saveStatus, lastSavedAt, dirty, onSave, onFit, onZoomToSelection, onOpenSummary }: Props) {
  const selectedIds = useWorkspaceStore((s) => s.selectedIds)
  const align = useWorkspaceStore((s) => s.align)
  const distribute = useWorkspaceStore((s) => s.distribute)
  const bringForward = useWorkspaceStore((s) => s.bringForward)
  const sendBackward = useWorkspaceStore((s) => s.sendBackward)
  const bringToFront = useWorkspaceStore((s) => s.bringToFront)
  const sendToBack = useWorkspaceStore((s) => s.sendToBack)
  const duplicateSelected = useWorkspaceStore((s) => s.duplicateSelected)
  const paste = useWorkspaceStore((s) => s.paste)
  const group = useWorkspaceStore((s) => s.group)
  const ungroup = useWorkspaceStore((s) => s.ungroup)
  const undo = useWorkspaceStore((s) => s.undo)
  const redo = useWorkspaceStore((s) => s.redo)
  const canUndo = useWorkspaceStore((s) => s.past.length > 0)
  const canRedo = useWorkspaceStore((s) => s.future.length > 0)
  const rotateSelected = useWorkspaceStore((s) => s.rotateSelected)
  const deleteSelected = useWorkspaceStore((s) => s.deleteSelected)
  const snapEnabled = useWorkspaceStore((s) => s.snapEnabled)
  const gridVisible = useWorkspaceStore((s) => s.gridVisible)
  const rulersVisible = useWorkspaceStore((s) => s.rulersVisible)
  const minimapVisible = useWorkspaceStore((s) => s.minimapVisible)
  const toggleSnap = useWorkspaceStore((s) => s.toggleSnap)
  const toggleGrid = useWorkspaceStore((s) => s.toggleGrid)
  const toggleRulers = useWorkspaceStore((s) => s.toggleRulers)
  const toggleMinimap = useWorkspaceStore((s) => s.toggleMinimap)
  const zoomIn = useWorkspaceStore((s) => s.zoomIn)
  const zoomOut = useWorkspaceStore((s) => s.zoomOut)
  const resetViewport = useWorkspaceStore((s) => s.resetViewport)

  const hasSelection = selectedIds.length > 0
  const hasMulti = selectedIds.length >= 2
  const hasThree = selectedIds.length >= 3

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-11 items-center gap-1 border-b border-border bg-card/70 px-2 backdrop-blur">
        {/* Undo / redo */}
        <IconBtn label="Undo (⌘Z)" onClick={undo} disabled={!canUndo}><Undo2 className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Redo (⇧⌘Z)" onClick={redo} disabled={!canRedo}><Redo2 className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Clipboard */}
        <IconBtn label="Duplicate (⌘D)" onClick={duplicateSelected} disabled={!hasSelection}><Copy className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Paste (⌘V)" onClick={paste}><ClipboardPaste className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Delete (Del)" onClick={deleteSelected} disabled={!hasSelection}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Rotate */}
        <IconBtn label="Rotate − 15° (⇧R)" onClick={() => rotateSelected(-15)} disabled={!hasSelection}><RotateCcw className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Rotate + 15° (R)"        onClick={() => rotateSelected(15)}  disabled={!hasSelection}><RotateCw  className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Align */}
        <IconBtn label="Align left"     onClick={() => align('left')}    disabled={!hasMulti}><AlignHorizontalJustifyStart className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Center horizontal" onClick={() => align('centerH')} disabled={!hasMulti}><AlignHorizontalJustifyCenter className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Align right"    onClick={() => align('right')}   disabled={!hasMulti}><AlignHorizontalJustifyEnd className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Align top"      onClick={() => align('top')}     disabled={!hasMulti}><AlignLeft className="h-3.5 w-3.5 rotate-90" /></IconBtn>
        <IconBtn label="Center vertical" onClick={() => align('centerV')} disabled={!hasMulti}><AlignVerticalJustifyCenter className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Align bottom"   onClick={() => align('bottom')}  disabled={!hasMulti}><AlignRight className="h-3.5 w-3.5 rotate-90" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Distribute */}
        <IconBtn label="Distribute horizontally" onClick={() => distribute('horizontal')} disabled={!hasThree}><AlignHorizontalDistributeCenter className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Distribute vertically"   onClick={() => distribute('vertical')}   disabled={!hasThree}><AlignVerticalDistributeCenter className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Z-order */}
        <IconBtn label="Bring forward (])" onClick={bringForward} disabled={!hasSelection}><ChevronsUp className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Send backward ([)" onClick={sendBackward} disabled={!hasSelection}><ChevronsDown className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Bring to front (⌘])" onClick={bringToFront} disabled={!hasSelection}><BringToFront className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Send to back (⌘[)"   onClick={sendToBack}   disabled={!hasSelection}><SendToBack   className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Group */}
        <IconBtn label="Group (⌘G)"      onClick={group}   disabled={!hasMulti}><Group className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Ungroup (⇧⌘G)" onClick={ungroup} disabled={!hasSelection}><Ungroup className="h-3.5 w-3.5" /></IconBtn>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* View */}
        <IconBtn label={snapEnabled ? 'Snap on'    : 'Snap off'}    onClick={toggleSnap}    className={snapEnabled    ? 'text-accent' : ''}><Magnet className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label={gridVisible ? 'Grid on'    : 'Grid off'}    onClick={toggleGrid}    className={gridVisible    ? 'text-accent' : ''}><Grid3x3 className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label={rulersVisible ? 'Rulers on' : 'Rulers off'} onClick={toggleRulers}  className={rulersVisible  ? 'text-accent' : ''}><Ruler className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label={minimapVisible ? 'Minimap on' : 'Minimap off'} onClick={toggleMinimap} className={minimapVisible ? 'text-accent' : ''}><Map className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Zoom out" onClick={zoomOut}><ZoomOut className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Zoom in"  onClick={zoomIn}><ZoomIn  className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Fit to screen (1)" onClick={onFit}><Maximize2 className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Zoom to selection (⇧1)" onClick={onZoomToSelection} disabled={!hasSelection}><Focus className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Reset view (100%)" onClick={resetViewport}><RefreshCcw className="h-3.5 w-3.5" /></IconBtn>

        <div className="flex-1" />

        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={onOpenSummary}>
          <Sparkles className="h-3.5 w-3.5" /> Engineering summary
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <SaveIndicator status={saveStatus} dirty={dirty} lastSavedAt={lastSavedAt} />

        <Button size="sm" className="h-7 gap-1" onClick={onSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
      </div>
    </TooltipProvider>
  )
}

function SaveIndicator({ status, lastSavedAt, dirty }: { status: WorkspaceSaveStatus; lastSavedAt: string | null; dirty: boolean }) {
  if (status === 'saving') {
    return <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
  }
  if (status === 'error') {
    return <span className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> Save failed</span>
  }
  if (dirty) {
    return <span className="text-[11px] text-amber-500">Unsaved changes</span>
  }
  if (lastSavedAt) {
    const d = new Date(lastSavedAt)
    const t = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    return <span className="flex items-center gap-1 text-[11px] text-emerald-500"><Check className="h-3 w-3" /> Saved {t}</span>
  }
  return <span className="text-[11px] text-muted-foreground">Not saved</span>
}
