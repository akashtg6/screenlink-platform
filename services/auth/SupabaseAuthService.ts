import type { SupabaseClient, Session as SbSession } from '@supabase/supabase-js'
import { getBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Credentials,
  Organization,
  ProfileUpdate,
  Role,
  RoleSlug,
  Session,
  SignUpPayload,
  User,
} from '@/types'
import { AuthErrorImpl, type AuthService } from './AuthService'

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
  organization_id: string | null
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  roles: {
    id: string
    slug: RoleSlug
    name: string
    description: string | null
    hierarchy: number
    is_system: boolean
  } | null
  organizations: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    website: string | null
    industry: string | null
    country: string | null
    created_at: string
    updated_at: string
  } | null
}

function mapProfile(row: ProfileRow, sbSession: SbSession): Session {
  if (!row.roles) {
    throw new AuthErrorImpl(
      'Profile is missing a role. Ensure the auth.users signup trigger ran successfully.',
      'PROFILE_MISSING_ROLE',
    )
  }

  const user: User = {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.email.split('@')[0],
    avatarUrl: row.avatar_url,
    jobTitle: row.job_title,
    organizationId: row.organization_id,
    roleId: row.role_id,
    roleSlug: row.roles.slug,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  const role: Role = {
    id: row.roles.id,
    slug: row.roles.slug,
    name: row.roles.name,
    description: row.roles.description ?? undefined,
    hierarchy: row.roles.hierarchy,
    isSystem: row.roles.is_system,
  }

  const organization: Organization | null = row.organizations
    ? {
        id: row.organizations.id,
        name: row.organizations.name,
        slug: row.organizations.slug,
        logoUrl: row.organizations.logo_url,
        website: row.organizations.website,
        industry: row.organizations.industry,
        country: row.organizations.country,
        createdAt: row.organizations.created_at,
        updatedAt: row.organizations.updated_at,
      }
    : null

  return {
    user,
    organization,
    role,
    accessToken: sbSession.access_token,
    expiresAt: sbSession.expires_at
      ? new Date(sbSession.expires_at * 1000).toISOString()
      : new Date(Date.now() + 3600_000).toISOString(),
  }
}

async function fetchProfileRow(sb: SupabaseClient, userId: string): Promise<ProfileRow> {
  const { data, error } = await sb
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, job_title, organization_id, role_id, is_active, created_at, updated_at, roles ( id, slug, name, description, hierarchy, is_system ), organizations ( id, name, slug, logo_url, website, industry, country, created_at, updated_at )',
    )
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new AuthErrorImpl(
      error?.message || 'Profile not found. The signup trigger may not have run yet.',
      'PROFILE_NOT_FOUND',
    )
  }
  return data as unknown as ProfileRow
}

export class SupabaseAuthService implements AuthService {
  private client(): SupabaseClient {
    if (!isSupabaseConfigured()) {
      throw new AuthErrorImpl(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.',
        'SUPABASE_NOT_CONFIGURED',
      )
    }
    return getBrowserSupabaseClient()
  }

  private wrapError(err: unknown): never {
    if (err instanceof AuthErrorImpl) throw err
    if (err && typeof err === 'object' && 'message' in err) {
      const anyErr = err as { message: string; status?: number; code?: string }
      throw new AuthErrorImpl(anyErr.message, anyErr.code || 'AUTH_ERROR', anyErr.status)
    }
    throw new AuthErrorImpl('Unknown authentication error', 'AUTH_ERROR')
  }

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null
    const sb = this.client()
    const { data, error } = await sb.auth.getSession()
    if (error || !data.session) return null
    try {
      const profile = await fetchProfileRow(sb, data.session.user.id)
      return mapProfile(profile, data.session)
    } catch {
      // Session exists but profile missing (trigger race). Force sign-out.
      await sb.auth.signOut()
      return null
    }
  }

  async signIn({ email, password, remember }: Credentials): Promise<Session> {
    const sb = this.client()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.session) this.wrapError(error || new Error('Sign-in failed'))

    // Remember-me preference stored in localStorage; consumed by AuthProvider.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('screenlink.remember', remember === false ? '0' : '1')
    }

    const profile = await fetchProfileRow(sb, data.session!.user.id)
    // Update last_sign_in_at (fire and forget)
    void sb.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', data.session!.user.id)
    return mapProfile(profile, data.session!)
  }

  async signUp({ email, password, fullName, organizationName, country }: SignUpPayload): Promise<Session | null> {
    const sb = this.client()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/dashboard`
        : undefined

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
          organization: organizationName,
          country,
        },
      },
    })
    if (error) this.wrapError(error)

    // If email confirmation is required, session will be null. UI will prompt user.
    if (!data.session) return null

    // Wait a beat for the DB trigger to insert the profile, then fetch.
    try {
      const profile = await fetchProfileRow(sb, data.session.user.id)
      return mapProfile(profile, data.session)
    } catch {
      // Retry once after a short delay in case the trigger hasn't committed yet.
      await new Promise((r) => setTimeout(r, 500))
      const profile = await fetchProfileRow(sb, data.session.user.id)
      return mapProfile(profile, data.session)
    }
  }

  async signInWithGoogle(redirectPath = '/dashboard'): Promise<void> {
    const sb = this.client()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) this.wrapError(error)
    // Supabase will redirect; nothing else to do.
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return
    const sb = this.client()
    const { error } = await sb.auth.signOut()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('screenlink.remember')
    }
    if (error) this.wrapError(error)
  }

  async sendPasswordReset(email: string, redirectUrl: string): Promise<void> {
    const sb = this.client()
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })
    if (error) this.wrapError(error)
  }

  async resetPassword(newPassword: string): Promise<void> {
    const sb = this.client()
    const { error } = await sb.auth.updateUser({ password: newPassword })
    if (error) this.wrapError(error)
  }

  async updateProfile(patch: ProfileUpdate): Promise<User> {
    const sb = this.client()
    const { data: userData } = await sb.auth.getUser()
    if (!userData.user) throw new AuthErrorImpl('Not authenticated', 'NOT_AUTHENTICATED', 401)

    const dbPatch: Record<string, string | null | undefined> = {}
    if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName
    if (patch.jobTitle !== undefined) dbPatch.job_title = patch.jobTitle
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl

    const { error } = await sb.from('profiles').update(dbPatch).eq('id', userData.user.id)
    if (error) this.wrapError(error)

    const row = await fetchProfileRow(sb, userData.user.id)
    const { data: sess } = await sb.auth.getSession()
    if (!sess.session) throw new AuthErrorImpl('Session lost', 'SESSION_LOST')
    return mapProfile(row, sess.session).user
  }

  onAuthStateChange(cb: (session: Session | null) => void): () => void {
    if (!isSupabaseConfigured()) return () => {}
    const sb = this.client()
    const { data } = sb.auth.onAuthStateChange(async (_event, sbSession) => {
      if (!sbSession) {
        cb(null)
        return
      }
      try {
        const row = await fetchProfileRow(sb, sbSession.user.id)
        cb(mapProfile(row, sbSession))
      } catch {
        cb(null)
      }
    })
    return () => data.subscription.unsubscribe()
  }
}
