import { redirect } from 'next/navigation'
import type { RoleSlug } from '@/types/role'
import { hasAtLeast } from '@/types/role'
import { requireAuth } from './require-auth'

/**
 * Server-side role guard. Redirects if the user does not hold at least
 * the required role in the role hierarchy (super_admin > organization_admin >
 * engineer > sales > viewer).
 *
 * Use in Server Components:
 *   const { user, profile } = await requireRole('organization_admin')
 */
export async function requireRole(minimum: RoleSlug, forbiddenRedirect = '/dashboard?error=forbidden') {
  const ctx = await requireAuth()
  if (!ctx.profile) return ctx
  const currentSlug = (ctx.profile as { roles?: { slug?: RoleSlug } | { slug?: RoleSlug }[] }).roles
  const slug = Array.isArray(currentSlug) ? currentSlug[0]?.slug : currentSlug?.slug
  if (!slug || !hasAtLeast(slug as RoleSlug, minimum)) {
    redirect(forbiddenRedirect)
  }
  return ctx
}

/**
 * Same, but takes an explicit set of allowed slugs (bypasses hierarchy).
 */
export async function requireAnyRole(allowed: RoleSlug[], forbiddenRedirect = '/dashboard?error=forbidden') {
  const ctx = await requireAuth()
  if (!ctx.profile) return ctx
  const currentSlug = (ctx.profile as { roles?: { slug?: RoleSlug } | { slug?: RoleSlug }[] }).roles
  const slug = Array.isArray(currentSlug) ? currentSlug[0]?.slug : currentSlug?.slug
  if (!slug || !allowed.includes(slug as RoleSlug)) {
    redirect(forbiddenRedirect)
  }
  return ctx
}
