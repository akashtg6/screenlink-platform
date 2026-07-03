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
  // PostgREST can return embedded resources as an object OR an array
  // depending on FK relationship inference. Handle both defensively.
  roles: RoleEmbed | RoleEmbed[] | null
  organizations: OrgEmbed | OrgEmbed[] | null
}

interface RoleEmbed {
  id: string
  slug: RoleSlug
  name: string
  description: string | null
  hierarchy: number
  is_system: boolean
}

interface OrgEmbed {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  country: string | null
  created_at: string
  updated_at: string
}

/** PostgREST returns embedded rows as `T | T[] | null` — normalise to a single. */
function firstOrNull<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function mapProfile(row: ProfileRow, sbSession: SbSession): Session {
  const roleRow = firstOrNull(row.roles)
  if (!roleRow) {
    throw new AuthErrorImpl(
      'Profile is missing a role. Ensure the auth.users signup trigger ran successfully.',
      'PROFILE_MISSING_ROLE',
    )
  }
  const orgRow = firstOrNull(row.organizations)

  const user: User = {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.email.split('@')[0],
    avatarUrl: row.avatar_url,
    jobTitle: row.job_title,
    organizationId: row.organization_id,
    roleId: row.role_id,
    roleSlug: roleRow.slug,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  const role: Role = {
    id: roleRow.id,
    slug: roleRow.slug,
    name: roleRow.name,
    description: roleRow.description ?? undefined,
    hierarchy: roleRow.hierarchy,
    isSystem: roleRow.is_system,
  }

  const organization: Organization | null = orgRow
    ? {
        id: orgRow.id,
        name: orgRow.name,
        slug: orgRow.slug,
        logoUrl: orgRow.logo_url,
        website: orgRow.website,
        industry: orgRow.industry,
        country: orgRow.country,
        createdAt: orgRow.created_at,
        updatedAt: orgRow.updated_at,
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
  // Hard timeout so a hung query can NEVER lock the AuthProvider.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const { data, error } = await sb
      .from('profiles')
      .select(
        'id, email, full_name, avatar_url, job_title, organization_id, role_id, is_active, created_at, updated_at, roles ( id, slug, name, description, hierarchy, is_system ), organizations ( id, name, slug, logo_url, website, industry, country, created_at, updated_at )',
      )
      .eq('id', userId)
      .abortSignal(controller.signal)
      .single()

    if (error || !data) {
      throw new AuthErrorImpl(
        error?.message || 'Profile not found. The signup trigger may not have run yet.',
        error?.code === 'PGRST116' ? 'PGRST116' : 'PROFILE_NOT_FOUND',
      )
    }
    return data as unknown as ProfileRow
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch the profile with a small retry window. Fixes the OAuth race where the
 * DB trigger (`handle_new_user`) may not yet have inserted the profile row by
 * the time the client-side session resolves. Retries: 250 ms, 700 ms, 1400 ms.
 *
 * Never calls signOut() — a transient miss must not destroy a valid session.
 */
async function fetchProfileRowWithRetry(sb: SupabaseClient, userId: string): Promise<ProfileRow> {
  const delaysMs = [0, 250, 700, 1400]
  let lastErr: unknown
  for (const delay of delaysMs) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
    try {
      return await fetchProfileRow(sb, userId)
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : ''
      // Retry only for the "row not yet visible" family of errors.
      if (!/not found|multiple \(or no\) rows|PGRST116/i.test(msg)) throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new AuthErrorImpl('Profile not found after retries', 'PROFILE_NOT_FOUND')
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
      const profile = await fetchProfileRowWithRetry(sb, data.session.user.id)
      return mapProfile(profile, data.session)
    } catch (err) {
      // Do NOT sign the user out here. A profile miss must surface, not silently
      // destroy the session (that caused Release 0.5.1's dashboard-hang bug).
      // eslint-disable-next-line no-console
      console.error('[auth] getSession: profile hydration failed', err)
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

    const profile = await fetchProfileRowWithRetry(sb, data.session!.user.id)
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

    // Wait for the DB trigger to insert the profile row, then fetch (with retry).
    const profile = await fetchProfileRowWithRetry(sb, data.session.user.id)
    return mapProfile(profile, data.session)
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
        const row = await fetchProfileRowWithRetry(sb, sbSession.user.id)
        cb(mapProfile(row, sbSession))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] onAuthStateChange: profile hydration failed', err)
        cb(null)
      }
    })
    return () => data.subscription.unsubscribe()
  }
}
