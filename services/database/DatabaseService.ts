import type { NewProjectInput, Paginated, Project } from '@/types'

export interface ProjectFilter {
  q?: string
  status?: Project['status']
  ownerId?: string
  page?: number
  pageSize?: number
}

export interface DatabaseService {
  listProjects(filter?: ProjectFilter): Promise<Paginated<Project>>
  getProject(id: string): Promise<Project | null>
  createProject(input: NewProjectInput, ownerId: string): Promise<Project>
  updateProject(id: string, patch: Partial<Project>): Promise<Project>
  deleteProject(id: string): Promise<void>
}
