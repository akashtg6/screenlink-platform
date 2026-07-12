/**
 * Sprint 6B — UI store.
 *
 * First of the five approved stores to be split out of the Sprint 6A monolith.
 * Owns ephemeral UI-only state (panel widths, active tool, dialogs). Persists
 * to localStorage so panel widths survive reloads. No domain data lives here.
 *
 * The remaining four stores (selection, viewport, history) will be split in
 * Sprint 6C now that the engine + event-bus foundation exists.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ActiveTool = 'select' | 'hand' | 'measure' | 'text'

export interface UiState {
  activeTool: ActiveTool
  toolboxWidth: number
  inspectorWidth: number
  layersPanelHeight: number
  showMinimap: boolean
  showRulers: boolean
  activeDialog: string | null

  setActiveTool(tool: ActiveTool): void
  setToolboxWidth(px: number): void
  setInspectorWidth(px: number): void
  setLayersPanelHeight(px: number): void
  toggleMinimap(): void
  toggleRulers(): void
  openDialog(id: string | null): void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeTool: 'select',
      toolboxWidth: 256,
      inspectorWidth: 320,
      layersPanelHeight: 240,
      showMinimap: true,
      showRulers: false,
      activeDialog: null,

      setActiveTool:        (activeTool)      => set({ activeTool }),
      setToolboxWidth:      (toolboxWidth)    => set({ toolboxWidth }),
      setInspectorWidth:    (inspectorWidth)  => set({ inspectorWidth }),
      setLayersPanelHeight: (layersPanelHeight) => set({ layersPanelHeight }),
      toggleMinimap:        ()                => set((s) => ({ showMinimap: !s.showMinimap })),
      toggleRulers:         ()                => set((s) => ({ showRulers: !s.showRulers })),
      openDialog:           (activeDialog)    => set({ activeDialog }),
    }),
    {
      name: 'screenlink.workspace.ui',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? undefinedStorage : window.localStorage)),
      version: 1,
    },
  ),
)

// SSR-safe fallback — zustand's persist middleware calls storage during hydration.
const undefinedStorage: Storage = {
  length: 0,
  clear() {},
  getItem() { return null },
  key() { return null },
  removeItem() {},
  setItem() {},
}
