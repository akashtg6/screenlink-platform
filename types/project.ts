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
  name: string
  code: string
  status: ProjectStatus
  customer: Customer
  requirements: DisplayRequirements
  location?: string
  budgetUsd?: number
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type NewProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'code'> & {
  code?: string
}
