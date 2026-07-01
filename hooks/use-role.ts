'use client'

import { useAuth } from './use-auth'
import { hasAtLeast, type RoleSlug } from '@/types/role'

/**
 * Role-based authorization hook.
 *
 *   const { role, is, atLeast, anyOf } = useRole()
 *   if (is('organization_admin')) { … }
 *   if (atLeast('engineer')) { … }
 *   if (anyOf(['engineer', 'sales'])) { … }
 */
export function useRole() {
  const { roleSlug, role } = useAuth()

  return {
    role,
    slug: roleSlug,
    is(slug: RoleSlug) {
      return roleSlug === slug
    },
    atLeast(minimum: RoleSlug) {
      return hasAtLeast(roleSlug ?? undefined, minimum)
    },
    anyOf(slugs: RoleSlug[]) {
      return roleSlug ? slugs.includes(roleSlug) : false
    },
    isAdmin() {
      return roleSlug === 'super_admin' || roleSlug === 'organization_admin'
    },
  }
}
