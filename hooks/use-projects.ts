'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project } from '@/types'
import { databaseService, type ProjectFilter } from '@/services/database'

export function useProjects(filter: ProjectFilter = {}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await databaseService.listProjects(filter)
      setProjects(result.data)
      setTotal(result.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.q, filter.status, filter.ownerId, filter.page, filter.pageSize])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { projects, total, loading, error, refresh }
}
