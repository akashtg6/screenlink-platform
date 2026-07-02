import type { NewProjectInput, Project } from '@/types'
import { databaseService, type ProjectFilter } from '@/services/database'

/**
 * ProjectRepository — higher-level orchestration on top of DatabaseService.
 *
 * Encapsulates:
 *  - Draft creation & incremental autosave
 *  - Duplicate
 *  - Archive / unarchive (status transition)
 *  - Tenant scoping (organizationId is always injected)
 *
 * UI code depends on this class, NOT on DatabaseService directly.
 */
export class ProjectRepository {
  constructor(private orgId: string, private userId: string) {}

  list(filter: Omit<ProjectFilter, 'organizationId'> = {}) {
    return databaseService.listProjects({ ...filter, organizationId: this.orgId })
  }

  get(id: string) {
    return databaseService.getProject(id, this.orgId)
  }

  create(input: NewProjectInput) {
    return databaseService.createProject(input, this.orgId, this.userId)
  }

  update(id: string, patch: Partial<Project>) {
    return databaseService.updateProject(id, this.orgId, patch)
  }

  async archive(id: string) {
    return this.update(id, { status: 'archived' })
  }

  async unarchive(id: string) {
    return this.update(id, { status: 'draft' })
  }

  async submit(id: string) {
    return this.update(id, { status: 'in_review' })
  }

  async duplicate(id: string): Promise<Project> {
    const source = await this.get(id)
    if (!source) throw new Error('Project not found')
    return this.create({
      name: `${source.name} (copy)`,
      status: 'draft',
      description: source.description,
      priority: source.priority,
      targetCompletionDate: source.targetCompletionDate,
      customer: source.customer,
      requirements: source.requirements,
      location: source.location,
      budgetUsd: source.budgetUsd,
      progressPercent: source.progressPercent,
    })
  }

  delete(id: string) {
    return databaseService.deleteProject(id, this.orgId)
  }
}
