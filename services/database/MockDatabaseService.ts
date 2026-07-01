import type { DatabaseService, ProjectFilter } from './DatabaseService'
import type { NewProjectInput, Paginated, Project } from '@/types'

/**
 * Client-side, per-organization localStorage mock. Sprint 3 will replace this
 * with SupabaseDatabaseService (real Postgres w/ RLS).
 *
 * NOTE: This is only used as a fallback until real Supabase-backed data access
 * is wired in Sprint 3 (Project Wizard). The interface itself is provider-agnostic
 * and enforces tenant scoping via `organizationId`.
 */
const STORAGE_PREFIX = 'screenlink.projects.'

function key(orgId: string) {
  return STORAGE_PREFIX + orgId
}

function seed(orgId: string): Project[] {
  const iso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
  return [
    {
      id: 'prj_001',
      organizationId: orgId,
      name: 'Nakheel Mall Anchor LED Wall',
      code: 'SL-2025-001',
      status: 'in_review',
      customer: { name: 'Ahmed Al Farsi', company: 'Nakheel Malls LLC', country: 'AE' },
      requirements: {
        displayType: 'led_indoor',
        targetWidthMm: 6400,
        targetHeightMm: 3600,
        aspectRatio: '16:9',
        pixelPitchMm: 1.9,
        viewingDistanceM: 4,
        environment: 'indoor',
        brightnessNits: 800,
      },
      location: 'Dubai, UAE',
      budgetUsd: 145000,
      createdBy: null,
      createdAt: iso(9),
      updatedAt: iso(2),
    },
    {
      id: 'prj_002',
      organizationId: orgId,
      name: 'Airport Terminal Wayfinding Video Wall',
      code: 'SL-2025-002',
      status: 'draft',
      customer: { name: 'M. Ravindran', company: 'BLR International Airport', country: 'IN' },
      requirements: {
        displayType: 'lcd_video_wall',
        targetWidthMm: 4200,
        targetHeightMm: 2360,
        aspectRatio: '16:9',
        viewingDistanceM: 6,
        environment: 'indoor',
        brightnessNits: 700,
      },
      location: 'Bengaluru, IN',
      budgetUsd: 72000,
      createdBy: null,
      createdAt: iso(4),
      updatedAt: iso(1),
    },
    {
      id: 'prj_003',
      organizationId: orgId,
      name: 'Stadium Perimeter LED — East Wing',
      code: 'SL-2025-003',
      status: 'approved',
      customer: { name: 'Sara Novak', company: 'SK Sports Ventures', country: 'DE' },
      requirements: {
        displayType: 'led_outdoor',
        targetWidthMm: 96000,
        targetHeightMm: 960,
        aspectRatio: '100:1',
        pixelPitchMm: 8,
        viewingDistanceM: 30,
        environment: 'outdoor',
        brightnessNits: 6500,
      },
      location: 'Munich, DE',
      budgetUsd: 480000,
      createdBy: null,
      createdAt: iso(21),
      updatedAt: iso(6),
    },
    {
      id: 'prj_004',
      organizationId: orgId,
      name: 'Corporate Lobby Interactive Kiosk',
      code: 'SL-2025-004',
      status: 'delivered',
      customer: { name: 'Yuki Tanaka', company: 'Mitsu Holdings', country: 'JP' },
      requirements: {
        displayType: 'interactive',
        targetWidthMm: 1920,
        targetHeightMm: 1080,
        aspectRatio: '16:9',
        viewingDistanceM: 1.2,
        environment: 'indoor',
        brightnessNits: 500,
      },
      location: 'Tokyo, JP',
      budgetUsd: 18500,
      createdBy: null,
      createdAt: iso(45),
      updatedAt: iso(30),
    },
  ]
}

function read(orgId: string): Project[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(key(orgId))
  if (!raw) {
    const s = seed(orgId)
    window.localStorage.setItem(key(orgId), JSON.stringify(s))
    return s
  }
  try { return JSON.parse(raw) as Project[] } catch { return [] }
}

function write(orgId: string, list: Project[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key(orgId), JSON.stringify(list))
}

function uid(prefix = 'prj') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function ensureOrg(id?: string): string {
  if (!id) throw new Error('organizationId is required (multi-tenant isolation)')
  return id
}

export class MockDatabaseService implements DatabaseService {
  async listProjects(filter: ProjectFilter = {}): Promise<Paginated<Project>> {
    await new Promise((r) => setTimeout(r, 80))
    const orgId = ensureOrg(filter.organizationId)
    let list = read(orgId)

    if (filter.q) {
      const q = filter.q.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.customer.company?.toLowerCase().includes(q) ||
          p.customer.name.toLowerCase().includes(q),
      )
    }
    if (filter.status) list = list.filter((p) => p.status === filter.status)

    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const start = (page - 1) * pageSize
    return { data: list.slice(start, start + pageSize), total: list.length, page, pageSize }
  }

  async getProject(id: string, organizationId: string) {
    await new Promise((r) => setTimeout(r, 40))
    return read(ensureOrg(organizationId)).find((p) => p.id === id) ?? null
  }

  async createProject(input: NewProjectInput, organizationId: string, createdBy: string): Promise<Project> {
    await new Promise((r) => setTimeout(r, 120))
    const orgId = ensureOrg(organizationId)
    const list = read(orgId)
    const nextIdx = list.length + 1
    const project: Project = {
      id: uid(),
      organizationId: orgId,
      code: input.code || `SL-${new Date().getFullYear()}-${String(nextIdx).padStart(3, '0')}`,
      name: input.name,
      status: input.status,
      customer: input.customer,
      requirements: input.requirements,
      location: input.location,
      budgetUsd: input.budgetUsd,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    write(orgId, [project, ...list])
    return project
  }

  async updateProject(id: string, organizationId: string, patch: Partial<Project>): Promise<Project> {
    await new Promise((r) => setTimeout(r, 80))
    const orgId = ensureOrg(organizationId)
    const list = read(orgId)
    const idx = list.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Project not found')
    const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() } as Project
    list[idx] = updated
    write(orgId, list)
    return updated
  }

  async deleteProject(id: string, organizationId: string) {
    await new Promise((r) => setTimeout(r, 60))
    const orgId = ensureOrg(organizationId)
    write(orgId, read(orgId).filter((p) => p.id !== id))
  }
}
