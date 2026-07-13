'use client'

/**
 * Sprint 7 — Space-drag pan tracker.
 *
 * Global keyboard listener that mirrors Space keydown/keyup into the
 * workspace store as `spacePressed`. The CanvasStage uses this flag to:
 *   • Show a `grab` cursor whenever Space is held.
 *   • Treat a *left*-mouse-down while Space is held as a pan gesture
 *     (matches Figma, Miro, AutoCAD).
 *
 * Listeners are ignored while the user is typing (input, textarea, select,
 * contenteditable) so keystrokes in the Properties inspector never trigger a
 * pan mode by accident.
 */

import * as React from 'react'
import { useWorkspaceStore } from './store'

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (t.isContentEditable) return true
  return false
}

export function useSpacePan(): void {
  React.useEffect(() => {
    const setSpace = useWorkspaceStore.getState().setSpacePressed
    let pressed = false

    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (isEditableTarget(e.target)) return
      // Prevent page scroll while the workspace has space-pan intent.
      e.preventDefault()
      if (!pressed) {
        pressed = true
        setSpace(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      pressed = false
      setSpace(false)
    }
    // Windows dropping keyup when the tab loses focus — reset defensively.
    const blur = () => { pressed = false; setSpace(false) }

    document.addEventListener('keydown', down)
    document.addEventListener('keyup',   up)
    window.addEventListener('blur', blur)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup',   up)
      window.removeEventListener('blur', blur)
      // Always leave the flag off so a re-mount doesn't get stuck.
      setSpace(false)
    }
  }, [])
}
