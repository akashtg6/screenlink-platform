'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project } from '@/types'
import { useProjectRepository } from './use-project-repository'

export function useProject(id: string | undefined) {
  const repo = useProjectRepository()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!repo || !id) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      setProject(await repo.get(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [repo, id])

  useEffect(() => { refresh() }, [refresh])

  return { project, loading, error, refresh, setProject }
}
