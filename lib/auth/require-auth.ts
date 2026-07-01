import { redirect } from 'next/navigation'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server'

/**
 * Enforces an authenticated user in Server Components / Route Handlers.
 * Redirects to /login when unauthenticated. Returns the Supabase user + profile row.
 */
export async function requireAuth(loginRedirect = '/login') {
  if (!isSupabaseConfigured()) {
    // Dev-mode fail-open. Do NOT deploy to production without keys configured.
    return { user: null, profile: null, supabase: null }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(loginRedirect)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, job_title, organization_id, role_id, is_active, roles ( slug, name, hierarchy ), organizations ( id, name )',
    )
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // Profile trigger failed — signed-in user but no profile. Force sign-out.
    await supabase.auth.signOut()
    redirect(loginRedirect + '?error=profile_missing')
  }

  return { user, profile, supabase }
}
