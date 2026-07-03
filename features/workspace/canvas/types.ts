/**
 * Sprint 6A — Engineering Workspace Foundation
 * Canvas domain types.
 *
 * Persisted verbatim inside `projects.requirements.workspace` (JSONB), so any
 * change here needs a version bump + migration on load.
 */

export const WORKSPACE_SCHEMA_VERSION = 1 as const

export type CabinetCategory = 'led' | 'lcd' | 'placeholder'

/** Static catalog entry — shipped with the app, not persisted. */
export interface CabinetCatalogItem {
  /** Stable identifier — persisted on the placed node as `catalogId`. */
  id: string
  category: CabinetCategory
  name: string
  manufacturer: string
  /** Physical dimensions in millimetres (canvas world units). */
  widthMm: number
  heightMm: number
  /** LED only — pitch in millimetres. */
  pixelPitchMm?: number
  /** Optional native resolution string, e.g. `'128x128'`, `'3840x2160'`. */
  resolution?: string
  /** Weight per unit in kg (informational). */
  weightKg?: number
  /** Short tag shown in the toolbox card. */
  tag?: string
  /** Accent colour token used in previews / on the canvas. */
  accent: 'red' | 'blue' | 'emerald' | 'amber' | 'violet' | 'slate'
}

/** A placed shape on the canvas. */
export interface WorkspaceNode {
  id: string
  catalogId: string
  category: CabinetCategory
  name: string
  /** World-space position of the shape's top-left corner (mm). */
  x: number
  y: number
  /** Displayed size in world units (mm) — usually the catalog dims. */
  width: number
  height: number
  /** Degrees. */
  rotation: number
  /** Layer this node lives on. */
  layerId: string
  /** True locks position + editing but keeps selection. */
  locked: boolean
  /** False hides the node entirely (still persisted). */
  visible: boolean
  /** Stacking order within the layer (lower = further back). */
  zIndex: number
  /** Members of the same group share this id. `null`/undefined = ungrouped. */
  groupId?: string | null
  /** Snapshot of catalog attrs at drop time (survives catalog changes). */
  meta?: {
    manufacturer?: string
    pixelPitchMm?: number
    resolution?: string
    accent?: CabinetCatalogItem['accent']
  }
}

export interface WorkspaceLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number
}

export interface WorkspaceViewport {
  /** World-space x offset (Konva stage x). */
  x: number
  /** World-space y offset (Konva stage y). */
  y: number
  /** Zoom multiplier (1 = 100%). */
  scale: number
}

export interface WorkspaceState {
  version: typeof WORKSPACE_SCHEMA_VERSION
  nodes: WorkspaceNode[]
  layers: WorkspaceLayer[]
  viewport: WorkspaceViewport
  /** ISO timestamp of the last persistence write. */
  updatedAt: string
}

export type WorkspaceStateDehydrated = Partial<WorkspaceState>
