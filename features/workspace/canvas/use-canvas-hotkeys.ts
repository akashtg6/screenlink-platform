'use client'

/**
 * Sprint 6A — Global keyboard shortcuts for the workspace canvas.
 *
 * Attached once by the workspace shell. Listeners are scoped to the document
 * but ignored when the user is typing inside an input / textarea / contenteditable
 * so we never hijack keys inside the Properties panel or layer-rename fields.
 */

import * as React from 'react'
import { useWorkspaceStore } from './store'
import { NUDGE_LARGE, NUDGE_SMALL } from './constants'

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (t.isContentEditable) return true
  return false
}

export function useCanvasHotkeys(opts: { onSave: () => void; onFit: () => void }): void {
  const { onSave, onFit } = opts

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const s = useWorkspaceStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const step = e.shiftKey ? NUDGE_LARGE : NUDGE_SMALL

      // Save
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); onSave(); return }
      // Undo / redo
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); s.undo(); return }
      if (mod && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault(); s.redo(); return
      }
      // Clipboard
      if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); s.copySelected(); return }
      if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); s.paste(); return }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); s.duplicateSelected(); return }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        s.selectMany(s.nodes.map((n) => n.id))
        return
      }
      // Grouping
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'g') { e.preventDefault(); s.group(); return }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'g') { e.preventDefault(); s.ungroup(); return }
      // Z-order
      if (!mod && e.key === ']') { e.preventDefault(); s.bringForward(); return }
      if (!mod && e.key === '[') { e.preventDefault(); s.sendBackward(); return }
      if (mod && e.key === ']') { e.preventDefault(); s.bringToFront(); return }
      if (mod && e.key === '[') { e.preventDefault(); s.sendToBack(); return }
      // Fit
      if (!mod && (e.key === '1' && e.shiftKey === false)) {
        e.preventDefault(); onFit(); return
      }
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); s.deleteSelected(); return
      }
      // Nudge
      if (e.key === 'ArrowLeft')  { e.preventDefault(); s.moveSelected(-step, 0); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); s.moveSelected(step, 0);  return }
      if (e.key === 'ArrowUp')    { e.preventDefault(); s.moveSelected(0, -step); return }
      if (e.key === 'ArrowDown')  { e.preventDefault(); s.moveSelected(0, step);  return }
      // Rotate
      if (!mod && e.key.toLowerCase() === 'r') {
        e.preventDefault(); s.rotateSelected(e.shiftKey ? -15 : 15); return
      }
      // Escape
      if (e.key === 'Escape') { s.clearSelection() }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onSave, onFit])
}
