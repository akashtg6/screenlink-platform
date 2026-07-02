'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project } from '@/types'
import type { ProjectFilter } from '@/services/database'
import { useProjectRepository } from './use-project-repository'

export interface UseProjectsResult {
  projects: Project[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProjects(filter: Omit<ProjectFilter, 'organizationId'> = {}): UseProjectsResult {
  const repo = useProjectRepository()
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const key = JSON.stringify({
    q: filter.q, status: filter.status, priority: filter.priority,
    sort: filter.sort, page: filter.page, pageSize: filter.pageSize,
    includeArchived: filter.includeArchived,
  })

  const refresh = useCallback(async () => {
    if (!repo) { setProjects([]); setTotal(0); setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const res = await repo.list(filter)
      setProjects(res.data)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, key])

  useEffect(() => { refresh() }, [refresh])

  return { projects, total, loading, error, refresh }
}
