import type { DatabaseService, ProjectFilter } from './DatabaseService'
import type { NewProjectInput, Paginated, Project } from '@/types'

const STORAGE_PREFIX = 'screenlink.projects.'
function key(orgId: string) { return STORAGE_PREFIX + orgId }

function seed(orgId: string): Project[] {
  const iso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
  const base = { organizationId: orgId, createdBy: null, updatedBy: null, progressPercent: 60 }
  return [
    {
      ...base, id: 'prj_001', name: 'Nakheel Mall Anchor LED Wall', code: 'SL-2025-001',
      status: 'in_review', priority: 'high', progressPercent: 78,
      customer: { name: 'Ahmed Al Farsi', company: 'Nakheel Malls LLC', country: 'AE', city: 'Dubai' },
      requirements: { application: 'retail', installation: { types: ['indoor', 'led'] }, display: { measurementUnit: 'mm', screenWidth: 6400, screenHeight: 3600, pixelPitchPreference: 1.9 } },
      location: 'Dubai, UAE', budgetUsd: 145000,
      description: 'Anchor LED wall for mall lobby with fine pixel pitch.',
      createdAt: iso(9), updatedAt: iso(2),
    },
    {
      ...base, id: 'prj_002', name: 'Airport Terminal Wayfinding Video Wall', code: 'SL-2025-002',
      status: 'draft', priority: 'medium', progressPercent: 34,
      customer: { name: 'M. Ravindran', company: 'BLR International Airport', country: 'IN', city: 'Bengaluru' },
      requirements: { application: 'transport', installation: { types: ['indoor', 'lcd_video_wall'] }, display: { measurementUnit: 'mm', screenWidth: 4200, screenHeight: 2360 } },
      location: 'Bengaluru, IN', budgetUsd: 72000,
      createdAt: iso(4), updatedAt: iso(1),
    },
    {
      ...base, id: 'prj_003', name: 'Stadium Perimeter LED — East Wing', code: 'SL-2025-003',
      status: 'approved', priority: 'critical', progressPercent: 100,
      customer: { name: 'Sara Novak', company: 'SK Sports Ventures', country: 'DE', city: 'Munich' },
      requirements: { application: 'stadium', installation: { types: ['outdoor', 'led'] }, display: { measurementUnit: 'mm', screenWidth: 96000, screenHeight: 960, pixelPitchPreference: 8 } },
      location: 'Munich, DE', budgetUsd: 480000,
      createdAt: iso(21), updatedAt: iso(6),
    },
    {
      ...base, id: 'prj_004', name: 'Corporate Lobby Interactive Kiosk', code: 'SL-2025-004',
      status: 'delivered', priority: 'low', progressPercent: 100,
      customer: { name: 'Yuki Tanaka', company: 'Mitsu Holdings', country: 'JP', city: 'Tokyo' },
      requirements: { application: 'corporate', installation: { types: ['indoor', 'interactive'] }, display: { measurementUnit: 'mm', screenWidth: 1920, screenHeight: 1080 } },
      location: 'Tokyo, JP', budgetUsd: 18500,
      createdAt: iso(45), updatedAt: iso(30),
    },
  ]
}

function read(orgId: string): Project[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(key(orgId))
  if (!raw) { const s = seed(orgId); window.localStorage.setItem(key(orgId), JSON.stringify(s)); return s }
  try { return JSON.parse(raw) as Project[] } catch { return [] }
}
function write(orgId: string, list: Project[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key(orgId), JSON.stringify(list))
}
function uid(prefix = 'prj') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}` }

export class MockDatabaseService implements DatabaseService {
  async listProjects(filter: ProjectFilter = {}): Promise<Paginated<Project>> {
    await new Promise((r) => setTimeout(r, 60))
    if (!filter.organizationId) return { data: [], total: 0, page: 1, pageSize: 12 }
    let list = read(filter.organizationId)
    if (filter.q) {
      const q = filter.q.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) ||
        p.customer.company?.toLowerCase().includes(q) || p.customer.name.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q))
    }
    if (filter.status) {
      const s = filter.status
      list = list.filter((p) => Array.isArray(s) ? s.includes(p.status) : p.status === s)
    }
    if (filter.priority) list = list.filter((p) => p.priority === filter.priority)
    if (!filter.includeArchived && !filter.status) list = list.filter((p) => p.status !== 'archived')

    switch (filter.sort ?? 'updated_desc') {
      case 'created_desc': list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break
      case 'name_asc':     list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name_desc':    list.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'progress_desc':list.sort((a, b) => b.progressPercent - a.progressPercent); break
      default:             list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    }

    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 12
    const start = (page - 1) * pageSize
    return { data: list.slice(start, start + pageSize), total: list.length, page, pageSize }
  }
  async getProject(id: string, organizationId: string) {
    return read(organizationId).find((p) => p.id === id) ?? null
  }
  async createProject(input: NewProjectInput, organizationId: string, createdBy: string): Promise<Project> {
    const list = read(organizationId)
    const idx = list.length + 1
    const p: Project = {
      id: uid(), organizationId, code: input.code || `SL-${new Date().getFullYear()}-${String(idx).padStart(3, '0')}`,
      name: input.name, status: input.status || 'draft', description: input.description,
      priority: input.priority, targetCompletionDate: input.targetCompletionDate,
      progressPercent: input.progressPercent ?? 0, customer: input.customer, requirements: input.requirements,
      location: input.location, budgetUsd: input.budgetUsd, createdBy, updatedBy: createdBy,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    write(organizationId, [p, ...list])
    return p
  }
  async updateProject(id: string, organizationId: string, patch: Partial<Project>): Promise<Project> {
    const list = read(organizationId)
    const i = list.findIndex((p) => p.id === id)
    if (i === -1) throw new Error('Project not found')
    const updated = { ...list[i], ...patch, updatedAt: new Date().toISOString() } as Project
    list[i] = updated
    write(organizationId, list)
    return updated
  }
  async deleteProject(id: string, organizationId: string) {
    write(organizationId, read(organizationId).filter((p) => p.id !== id))
  }
}
