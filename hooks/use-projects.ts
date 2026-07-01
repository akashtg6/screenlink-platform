'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project } from '@/types'
import { databaseService, type ProjectFilter } from '@/services/database'
import { useOrganization } from './use-organization'

export function useProjects(filter: Omit<ProjectFilter, 'organizationId'> = {}) {
  const { organization } = useOrganization()
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!organization) {
      setProjects([])
      setTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await databaseService.listProjects({
        ...filter,
        organizationId: organization.id,
      })
      setProjects(result.data)
      setTotal(result.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, filter.q, filter.status, filter.page, filter.pageSize])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { projects, total, loading, error, refresh }
}
