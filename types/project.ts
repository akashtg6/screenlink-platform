export type ProjectStatus = 'draft' | 'in_review' | 'approved' | 'delivered' | 'archived'
export type DisplayType = 'led_indoor' | 'led_outdoor' | 'lcd_video_wall' | 'interactive'

export interface Customer {
  name: string
  company?: string
  email?: string
  phone?: string
  country?: string
}

export interface DisplayRequirements {
  displayType: DisplayType
  targetWidthMm?: number
  targetHeightMm?: number
  aspectRatio?: string
  pixelPitchMm?: number
  viewingDistanceM?: number
  contentType?: string
  environment?: 'indoor' | 'outdoor' | 'semi_outdoor'
  brightnessNits?: number
}

export interface Project {
  id: string
  organizationId: string
  code: string
  name: string
  status: ProjectStatus
  customer: Customer
  requirements: DisplayRequirements
  location?: string
  budgetUsd?: number
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export type NewProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdBy' | 'code'> & {
  code?: string
}
