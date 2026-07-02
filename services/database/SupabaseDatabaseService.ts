import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { NewProjectInput, Paginated, Project } from '@/types'
import type { DatabaseService, ProjectFilter } from './DatabaseService'

interface ProjectRow {
  id: string
  organization_id: string
  code: string
  name: string
  description: string | null
  status: Project['status']
  priority: Project['priority'] | null
  target_completion_date: string | null
  progress_percent: number
  display_type: string | null
  customer: Record<string, unknown>
  requirements: Record<string, unknown>
  location: string | null
  budget_usd: number | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

function mapRow(r: ProjectRow): Project {
  return {
    id: r.id,
    organizationId: r.organization_id,
    code: r.code,
    name: r.name,
    description: r.description ?? undefined,
    status: r.status,
    priority: r.priority ?? undefined,
    targetCompletionDate: r.target_completion_date ?? undefined,
    progressPercent: r.progress_percent ?? 0,
    customer: (r.customer as unknown as Project['customer']) ?? { name: '' },
    requirements: (r.requirements as unknown as Project['requirements']) ?? {},
    location: r.location ?? undefined,
    budgetUsd: r.budget_usd ?? undefined,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDbPatch(p: Partial<Project>): Record<string, unknown> {
  const d: Record<string, unknown> = {}
  if (p.code !== undefined) d.code = p.code
  if (p.name !== undefined) d.name = p.name
  if (p.description !== undefined) d.description = p.description || null
  if (p.status !== undefined) d.status = p.status
  if (p.priority !== undefined) d.priority = p.priority || null
  if (p.targetCompletionDate !== undefined) d.target_completion_date = p.targetCompletionDate || null
  if (p.progressPercent !== undefined) d.progress_percent = p.progressPercent
  if (p.customer !== undefined) d.customer = p.customer
  if (p.requirements !== undefined) d.requirements = p.requirements
  if (p.location !== undefined) d.location = p.location || null
  if (p.budgetUsd !== undefined) d.budget_usd = p.budgetUsd ?? null
  return d
}

async function nextProjectCode(sb: SupabaseClient, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await sb
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  const idx = (count ?? 0) + 1
  return `SL-${year}-${String(idx).padStart(3, '0')}`
}

export class SupabaseDatabaseService implements DatabaseService {
  private client(): SupabaseClient {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    return getBrowserSupabaseClient()
  }

  async listProjects(filter: ProjectFilter = {}): Promise<Paginated<Project>> {
    const sb = this.client()
    let query = sb.from('projects').select('*', { count: 'exact' })

    if (filter.organizationId) query = query.eq('organization_id', filter.organizationId)
    if (filter.priority) query = query.eq('priority', filter.priority)
    if (filter.status) {
      if (Array.isArray(filter.status)) query = query.in('status', filter.status)
      else query = query.eq('status', filter.status)
    }
    if (!filter.includeArchived && !filter.status) query = query.neq('status', 'archived')

    if (filter.q) {
      const q = filter.q.trim()
      // ILIKE across name, code, and location; customer name is JSONB
      query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,location.ilike.%${q}%`)
    }

    switch (filter.sort ?? 'updated_desc') {
      case 'created_desc': query = query.order('created_at', { ascending: false }); break
      case 'name_asc':     query = query.order('name', { ascending: true }); break
      case 'name_desc':    query = query.order('name', { ascending: false }); break
      case 'progress_desc':query = query.order('progress_percent', { ascending: false }); break
      default:             query = query.order('updated_at', { ascending: false })
    }

    const page = Math.max(1, filter.page ?? 1)
    const pageSize = Math.min(100, filter.pageSize ?? 12)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data as ProjectRow[]).map(mapRow),
      total: count ?? data?.length ?? 0,
      page,
      pageSize,
    }
  }

  async getProject(id: string, organizationId: string): Promise<Project | null> {
    const sb = this.client()
    const { data, error } = await sb.from('projects').select('*')
      .eq('id', id).eq('organization_id', organizationId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRow(data as ProjectRow) : null
  }

  async createProject(input: NewProjectInput, organizationId: string, createdBy: string): Promise<Project> {
    const sb = this.client()
    const code = input.code || (await nextProjectCode(sb, organizationId))
    const row = {
      organization_id: organizationId,
      code,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? 'draft',
      priority: input.priority ?? null,
      target_completion_date: input.targetCompletionDate ?? null,
      progress_percent: input.progressPercent ?? 0,
      customer: input.customer,
      requirements: input.requirements,
      location: input.location ?? null,
      budget_usd: input.budgetUsd ?? null,
      created_by: createdBy,
    }
    const { data, error } = await sb.from('projects').insert(row).select('*').single()
    if (error) throw new Error(error.message)
    return mapRow(data as ProjectRow)
  }

  async updateProject(id: string, organizationId: string, patch: Partial<Project>): Promise<Project> {
    const sb = this.client()
    const { data, error } = await sb.from('projects')
      .update(toDbPatch(patch))
      .eq('id', id).eq('organization_id', organizationId)
      .select('*').single()
    if (error) throw new Error(error.message)
    return mapRow(data as ProjectRow)
  }

  async deleteProject(id: string, organizationId: string): Promise<void> {
    const sb = this.client()
    const { error } = await sb.from('projects').delete().eq('id', id).eq('organization_id', organizationId)
    if (error) throw new Error(error.message)
  }
}
