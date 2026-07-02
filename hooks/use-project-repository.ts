'use client'

import { useMemo } from 'react'
import { ProjectRepository } from '@/repositories/project-repository'
import { useAuth } from './use-auth'

/**
 * Hook that yields a memoised ProjectRepository bound to the current session
 * (user + organization). Returns null while auth is loading or unauthenticated.
 */
export function useProjectRepository(): ProjectRepository | null {
  const { user, organization } = useAuth()
  return useMemo(() => {
    if (!user || !organization) return null
    return new ProjectRepository(organization.id, user.id)
  }, [user, organization])
}
