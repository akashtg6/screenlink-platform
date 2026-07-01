'use client'

import { useAuth } from './use-auth'

/** Current tenant / organization for the signed-in user. */
export function useOrganization() {
  const { organization, loading } = useAuth()
  return { organization, loading }
}
