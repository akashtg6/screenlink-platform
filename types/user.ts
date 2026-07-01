import type { Organization } from './organization'
import type { Role, RoleSlug } from './role'

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
  jobTitle?: string | null
  organizationId?: string | null
  roleId: string
  roleSlug: RoleSlug
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface Session {
  user: User
  organization: Organization | null
  role: Role
  accessToken: string
  expiresAt: string
}

export interface Credentials {
  email: string
  password: string
  remember?: boolean
}

export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  organizationName?: string
  country?: string
}

export interface ProfileUpdate {
  fullName?: string
  jobTitle?: string
  avatarUrl?: string | null
}

export interface AuthError extends Error {
  code?: string
  status?: number
}
