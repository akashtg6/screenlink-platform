import type { NewProjectInput, Paginated, Project, ProjectStatus, ProjectPriority } from '@/types'

export interface ProjectFilter {
  q?: string
  status?: ProjectStatus | ProjectStatus[]
  priority?: ProjectPriority
  organizationId?: string
  sort?: 'updated_desc' | 'created_desc' | 'name_asc' | 'name_desc' | 'progress_desc'
  page?: number
  pageSize?: number
  includeArchived?: boolean
}

export interface DatabaseService {
  listProjects(filter?: ProjectFilter): Promise<Paginated<Project>>
  getProject(id: string, organizationId: string): Promise<Project | null>
  createProject(input: NewProjectInput, organizationId: string, createdBy: string): Promise<Project>
  updateProject(id: string, organizationId: string, patch: Partial<Project>): Promise<Project>
  deleteProject(id: string, organizationId: string): Promise<void>
}
