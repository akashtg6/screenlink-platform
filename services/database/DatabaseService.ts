import type { NewProjectInput, Paginated, Project } from '@/types'

export interface ProjectFilter {
  q?: string
  status?: Project['status']
  organizationId?: string
  page?: number
  pageSize?: number
}

/**
 * Provider-agnostic data access contract.
 * Every method is TENANT-SCOPED by `organizationId`.
 */
export interface DatabaseService {
  listProjects(filter?: ProjectFilter): Promise<Paginated<Project>>
  getProject(id: string, organizationId: string): Promise<Project | null>
  createProject(input: NewProjectInput, organizationId: string, createdBy: string): Promise<Project>
  updateProject(id: string, organizationId: string, patch: Partial<Project>): Promise<Project>
  deleteProject(id: string, organizationId: string): Promise<void>
}
