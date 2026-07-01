export type RoleSlug =
  | 'super_admin'
  | 'organization_admin'
  | 'engineer'
  | 'sales'
  | 'viewer'

export interface Role {
  id: string
  slug: RoleSlug
  name: string
  description?: string
  hierarchy: number
  isSystem: boolean
}

export const ROLE_LABELS: Record<RoleSlug, string> = {
  super_admin: 'Super Admin',
  organization_admin: 'Organization Admin',
  engineer: 'Engineer',
  sales: 'Sales',
  viewer: 'Viewer',
}

export const ROLE_HIERARCHY: Record<RoleSlug, number> = {
  super_admin: 100,
  organization_admin: 80,
  engineer: 60,
  sales: 40,
  viewer: 20,
}

/** Returns true if `actual` role is at least as privileged as `required`. */
export function hasAtLeast(actual: RoleSlug | undefined, required: RoleSlug): boolean {
  if (!actual) return false
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required]
}
