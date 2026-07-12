/**
 * Sprint 6B — Workspace Engine · types
 *
 * Canonical hierarchical model for the Engineering Workspace.
 * Persisted verbatim to Postgres JSONB, so every change must bump the
 * `WORKSPACE_SCHEMA_VERSION` and add a migration in `../migrations/`.
 */

/* -------------------------------------------------------------------------- */
/* IDs & primitives                                                            */
/* -------------------------------------------------------------------------- */

export type WorkspaceId = string
export type ObjectId = string
export type LayerId = string
export type GroupId = string
export type CommandId = string
export type EventId = string
export type UserId = string

export interface Point { x: number; y: number }
export interface Size  { width: number; height: number }
export interface Aabb  { minX: number; minY: number; maxX: number; maxY: number }

export type ISOString = string

/* -------------------------------------------------------------------------- */
/* Schema version                                                              */
/* -------------------------------------------------------------------------- */

/** Current schema version. Bump on breaking model changes. */
export const WORKSPACE_SCHEMA_VERSION = 2 as const
export type WorkspaceSchemaVersion = typeof WORKSPACE_SCHEMA_VERSION

/* -------------------------------------------------------------------------- */
/* Root Workspace                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Hierarchical Workspace — the root serialisation object.
 *
 * NOTE: `history` is intentionally NOT included. History is an ephemeral
 * in-memory concept in the client; the persisted workspace is the *result*
 * of applied history, not the log itself. Sprint 7C introduces a separate
 * `workspace_snapshots` table for named history.
 */
export interface Workspace {
  id: WorkspaceId
  projectId: string
  schemaVersion: WorkspaceSchemaVersion
  createdAt: ISOString
  updatedAt: ISOString
  createdBy: UserId | null

  metadata: WorkspaceMetadata
  canvas: Canvas
  layers: Layer[]
  objects: WorkspaceObject[]
  viewport: Viewport
  settings: WorkspaceSettings
}

export interface WorkspaceMetadata {
  name?: string
  description?: string
  tags?: string[]
  thumbnailUrl?: string
}

export interface Canvas {
  background: CanvasBackground
  units: DisplayUnit
  paperSize?: PaperSize
}

export interface CanvasBackground {
  color: string
  imageUrl?: string
  imageOpacity?: number
}

export type DisplayUnit = 'mm' | 'cm' | 'inch' | 'm'

export interface PaperSize {
  widthMm: number
  heightMm: number
  name?: string
}

export interface WorkspaceSettings {
  grid: GridSettings
  snap: SnapSettings
  autoSaveIntervalMs: number
}

export interface GridSettings {
  visible: boolean
  stepMm: number
  majorEvery: number
}

export interface SnapSettings {
  enabled: boolean
  stepMm: number
}

/* -------------------------------------------------------------------------- */
/* Layers                                                                      */
/* -------------------------------------------------------------------------- */

export interface Layer {
  id: LayerId
  name: string
  visible: boolean
  locked: boolean
  order: number
  opacity?: number
}

/* -------------------------------------------------------------------------- */
/* Viewport                                                                    */
/* -------------------------------------------------------------------------- */

export interface Viewport {
  x: number
  y: number
  scale: number
}

/* -------------------------------------------------------------------------- */
/* Objects — discriminated union                                              */
/* -------------------------------------------------------------------------- */

export type ObjectKind =
  | 'cabinet'
  | 'lcd'
  | 'controller'
  | 'receiving-card'
  | 'sending-card'
  | 'power-supply'
  | 'media-player'
  | 'accessory'
  | 'image'
  | 'text'
  | 'shape'
  | 'group'
  | 'placeholder'

/** Common base every WorkspaceObject inherits. */
export interface BaseObject {
  id: ObjectId
  kind: ObjectKind
  name: string

  /** World-mm top-left position. */
  x: number
  y: number

  /** World-mm size. */
  width: number
  height: number

  /** Degrees, about centre. */
  rotation: number

  layerId: LayerId
  locked: boolean
  visible: boolean
  /** Stacking order within layer (lower = further back). */
  zIndex: number
  groupId?: GroupId | null

  /** Optional library reference the object was created from. */
  libraryItemId?: string

  /** Free-form user notes. */
  notes?: string
}

export interface CabinetObject extends BaseObject {
  kind: 'cabinet'
  manufacturer: string
  pixelPitchMm: number
  resolution: { w: number; h: number }
  weightKg?: number
  powerW?: number
  accent?: AccentColor
}

export interface LcdObject extends BaseObject {
  kind: 'lcd'
  manufacturer: string
  resolution: { w: number; h: number }
  bezelMm?: number
  weightKg?: number
  accent?: AccentColor
}

export interface ControllerObject extends BaseObject {
  kind: 'controller'
  manufacturer: string
  maxPixels?: number
  outputs?: number
  accent?: AccentColor
}

export interface ReceivingCardObject extends BaseObject {
  kind: 'receiving-card'
  manufacturer: string
  accent?: AccentColor
}

export interface SendingCardObject extends BaseObject {
  kind: 'sending-card'
  manufacturer: string
  outputs?: number
  accent?: AccentColor
}

export interface PowerSupplyObject extends BaseObject {
  kind: 'power-supply'
  manufacturer: string
  wattage?: number
  accent?: AccentColor
}

export interface MediaPlayerObject extends BaseObject {
  kind: 'media-player'
  manufacturer: string
  accent?: AccentColor
}

export interface AccessoryObject extends BaseObject {
  kind: 'accessory'
  manufacturer?: string
  accent?: AccentColor
}

export interface ImageObject extends BaseObject {
  kind: 'image'
  src: string
  opacity: number
  fit: 'contain' | 'cover' | 'stretch'
}

export interface TextObject extends BaseObject {
  kind: 'text'
  text: string
  fontSize: number
  color: string
}

export interface ShapeObject extends BaseObject {
  kind: 'shape'
  shape: 'rectangle' | 'ellipse' | 'line'
  stroke: string
  strokeWidth: number
  fill: string
}

export interface GroupObject extends BaseObject {
  kind: 'group'
  childIds: ObjectId[]
  collapsed?: boolean
}

export interface PlaceholderObject extends BaseObject {
  kind: 'placeholder'
  manufacturer?: string
  accent?: AccentColor
}

export type WorkspaceObject =
  | CabinetObject
  | LcdObject
  | ControllerObject
  | ReceivingCardObject
  | SendingCardObject
  | PowerSupplyObject
  | MediaPlayerObject
  | AccessoryObject
  | ImageObject
  | TextObject
  | ShapeObject
  | GroupObject
  | PlaceholderObject

export type AccentColor = 'red' | 'blue' | 'emerald' | 'amber' | 'violet' | 'slate'

/* -------------------------------------------------------------------------- */
/* Legacy alias                                                                */
/* -------------------------------------------------------------------------- */

/** Backwards-compatible alias so Sprint 6A imports keep compiling. */
export type WorkspaceNode = WorkspaceObject
