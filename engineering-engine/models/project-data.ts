import type { MeasurementUnit } from '../constants/units'

export type InstallationType =
  | 'indoor' | 'outdoor' | 'rental' | 'transparent' | 'interactive'
  | 'creative' | 'lcd_video_wall' | 'led' | 'custom'

export type DisplayFamily = 'led' | 'lcd' | 'projection' | 'transparent'

export type Orientation = 'landscape' | 'portrait' | 'curved' | 'corner' | 'custom_shape'

export type EnvironmentType = 'indoor' | 'outdoor' | 'semi_outdoor'

export type ContentClass =
  | 'powerpoint' | 'video' | 'broadcast' | 'control_room'
  | 'dashboard' | 'advertising' | 'gaming' | 'mixed'

/**
 * Input to the Engineering Engine.
 *
 * The engine is FRAMEWORK-AGNOSTIC — this shape is decoupled from Supabase,
 * React, and the UI wizard schemas. Adapters at the application boundary map
 * to this shape.
 */
export interface ProjectData {
  // Project meta — optional identification only.
  readonly projectId?: string
  readonly projectName?: string
  readonly application?: string

  // Installation
  readonly installationTypes?: InstallationType[]
  readonly displayFamily?: DisplayFamily

  // Dimensions (in `measurementUnit`)
  readonly width: number
  readonly height: number
  readonly measurementUnit: MeasurementUnit

  // Optical
  readonly pixelPitchMm: number      // ALWAYS in millimetres regardless of dimension unit
  readonly cabinetWidthMm?: number
  readonly cabinetHeightMm?: number

  // Viewing / environment
  readonly viewingDistanceM?: number
  readonly orientation?: Orientation
  readonly brightnessNits?: number
  readonly environment?: EnvironmentType
  readonly operationHoursPerDay?: number
  readonly contentType?: ContentClass

  /** Extension point for provider-specific fields. Engine ignores unknown keys. */
  readonly extras?: Readonly<Record<string, unknown>>
}
