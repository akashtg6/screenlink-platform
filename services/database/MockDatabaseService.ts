import type { DatabaseService, ProjectFilter } from './DatabaseService'
import type { NewProjectInput, Paginated, Project } from '@/types'

const STORAGE_KEY = 'screenlink.projects'

function seed(): Project[] {
  const iso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
  return [
    {
      id: 'prj_001',
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
      ownerId: 'usr_demo',
      createdAt: iso(9),
      updatedAt: iso(2),
    },
    {
      id: 'prj_002',
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
      ownerId: 'usr_demo',
      createdAt: iso(4),
      updatedAt: iso(1),
    },
    {
      id: 'prj_003',
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
      ownerId: 'usr_demo',
      createdAt: iso(21),
      updatedAt: iso(6),
    },
    {
      id: 'prj_004',
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
      ownerId: 'usr_demo',
      createdAt: iso(45),
      updatedAt: iso(30),
    },
  ]
}

function read(): Project[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const s = seed()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
  try { return JSON.parse(raw) as Project[] } catch { return [] }
}

function write(list: Project[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function uid(prefix = 'prj') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export class MockDatabaseService implements DatabaseService {
  async listProjects(filter: ProjectFilter = {}): Promise<Paginated<Project>> {
    await new Promise((r) => setTimeout(r, 120))
    let list = read()
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
    if (filter.ownerId) list = list.filter((p) => p.ownerId === filter.ownerId)

    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const start = (page - 1) * pageSize
    return {
      data: list.slice(start, start + pageSize),
      total: list.length,
      page,
      pageSize,
    }
  }

  async getProject(id: string) {
    await new Promise((r) => setTimeout(r, 80))
    return read().find((p) => p.id === id) ?? null
  }

  async createProject(input: NewProjectInput, ownerId: string): Promise<Project> {
    await new Promise((r) => setTimeout(r, 200))
    const list = read()
    const nextIdx = list.length + 1
    const project: Project = {
      id: uid(),
      code: input.code || `SL-${new Date().getFullYear()}-${String(nextIdx).padStart(3, '0')}`,
      name: input.name,
      status: input.status,
      customer: input.customer,
      requirements: input.requirements,
      location: input.location,
      budgetUsd: input.budgetUsd,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    write([project, ...list])
    return project
  }

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    await new Promise((r) => setTimeout(r, 150))
    const list = read()
    const idx = list.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Project not found')
    const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() } as Project
    list[idx] = updated
    write(list)
    return updated
  }

  async deleteProject(id: string) {
    await new Promise((r) => setTimeout(r, 100))
    write(read().filter((p) => p.id !== id))
  }
}
