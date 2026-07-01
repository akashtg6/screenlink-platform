export type UserRole = 'admin' | 'engineer' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  role: UserRole
  organization?: string
  jobTitle?: string
  createdAt: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export interface Credentials {
  email: string
  password: string
}

export interface SignUpPayload extends Credentials {
  name: string
  organization?: string
}
