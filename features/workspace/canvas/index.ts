/**
 * Sprint 6A — Public entry point for the canvas module.
 */
export { WorkspaceShellCanvas } from './components/WorkspaceShellCanvas'
export { useWorkspaceStore } from './store'
export { CABINET_CATALOG, catalogByCategory, findCatalog } from './catalog'
export type {
  WorkspaceState, WorkspaceNode, WorkspaceLayer, WorkspaceViewport,
  CabinetCategory, CabinetCatalogItem,
} from './types'
