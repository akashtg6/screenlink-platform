/**
 * Sprint 6B — Workspace stores barrel.
 *
 * Public entry for the split-store architecture. Sprint 6B ships `useUiStore`
 * and the shared event bus + command bus singletons. Sprint 6C will extract
 * `useSelectionStore`, `useViewportStore`, `useHistoryStore`, and the pure
 * `useCanvasStore` from `features/workspace/canvas/store.ts`.
 */

import { createEventBus, createPluginRegistry } from '@/engines/workspace-engine'

export { useUiStore } from './ui'
export type { ActiveTool, UiState } from './ui'

/**
 * Single shared event bus instance. Commands emit events here; stores + UI
 * subscribers listen. Kept as a module singleton so hot-reload doesn't leak
 * new buses per render pass.
 */
export const workspaceEventBus = createEventBus()

/** Plugin registry singleton — exercised in Sprint 8A. */
export const workspacePluginRegistry = createPluginRegistry()
