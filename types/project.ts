// Sprint 3 extended domain model

export type ProjectStatus = 'draft' | 'in_review' | 'approved' | 'delivered' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type MeasurementUnit = 'mm' | 'cm' | 'm' | 'inch'

export type InstallationType =
  | 'indoor' | 'outdoor' | 'rental' | 'transparent' | 'interactive'
  | 'creative' | 'lcd_video_wall' | 'led' | 'custom'

export type MountingType = 'wall' | 'pole' | 'floor' | 'hanging' | 'ceiling'
export type MaintenanceAccess = 'front' | 'rear' | 'both'
export type Orientation = 'landscape' | 'portrait' | 'curved' | 'corner' | 'custom_shape'
export type AmbientLight = 'low' | 'medium' | 'high'
export type ContentType =
  | 'powerpoint' | 'video' | 'broadcast' | 'control_room'
  | 'dashboard' | 'advertising' | 'gaming' | 'mixed'
export type Application = 'corporate' | 'retail' | 'transport' | 'stadium' | 'broadcast' | 'control_room' | 'hospitality' | 'education' | 'other'

export interface Customer {
  name: string
  consultant?: string
  integrator?: string
  country?: string
  city?: string
  email?: string
  phone?: string
  company?: string
}

export interface InstallationConfig {
  types: InstallationType[]
  mountingType?: MountingType
  maintenanceAccess?: MaintenanceAccess
}

export interface DisplayConfig {
  screenWidth?: number
  screenHeight?: number
  measurementUnit: MeasurementUnit
  pixelPitchPreference?: number
  cabinetSize?: string
  preferredResolution?: string
  orientation?: Orientation
  displayQuantity?: number
}

export interface ViewingConfig {
  nearestDistanceM?: number
  farthestDistanceM?: number
  viewingHeightM?: number
  viewingAngle?: number
  contentType?: ContentType
  ambientLight?: AmbientLight
  directSunlight?: boolean
  operationHoursPerDay?: number
}

export interface ElectricalConfig {
  voltage?: string           // e.g. '220V/50Hz'
  availablePowerKw?: number
  ups?: boolean
  generator?: boolean
  internet?: ('lan' | 'wifi' | 'fiber')[]
  remoteMonitoring?: boolean
}

export interface Requirements {
  installation?: InstallationConfig
  display?: DisplayConfig
  viewing?: ViewingConfig
  electrical?: ElectricalConfig
  application?: Application
}

export interface Project {
  id: string
  organizationId: string
  code: string
  name: string
  description?: string
  status: ProjectStatus
  priority?: ProjectPriority
  targetCompletionDate?: string // ISO date
  progressPercent: number
  customer: Customer
  requirements: Requirements
  location?: string
  budgetUsd?: number
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

export type NewProjectInput = Omit<Project,
  'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdBy' | 'updatedBy' | 'progressPercent'
> & {
  code?: string
  progressPercent?: number
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  delivered: 'Delivered',
  archived: 'Archived',
}

export const PROJECT_STATUS_TONE: Record<ProjectStatus, 'neutral' | 'warning' | 'info' | 'success' | 'muted'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'info',
  delivered: 'success',
  archived: 'muted',
}

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
}
