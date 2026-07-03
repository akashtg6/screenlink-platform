import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server'

/**
 * BULLETPROOF SIGN-OUT — Release 0.5.1 safety valve.
 *
 * A dedicated server route that clears the Supabase session cookies and
 * redirects to /login. Works even when client-side JS is completely broken:
 *   - Users can navigate to `/logout` by typing the URL directly.
 *   - The top-nav "Log out" link points here.
 *   - No auth check needed — clearing a non-existent session is a no-op.
 *
 * Handles both GET (link/bookmark) and POST (form) for maximum compatibility.
 */
async function handleLogout(): Promise<NextResponse> {
  // 1) Ask Supabase to sign the user out (revokes refresh token server-side).
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient()
      await supabase.auth.signOut()
    }
  } catch {
    // Ignore — we're going to nuke the cookies below regardless.
  }

  // 2) Build a redirect and force-expire ANY cookie that looks like a Supabase
  //    auth cookie. This is defence-in-depth against any state inconsistency.
  const cookieStore = await cookies()
  const all = cookieStore.getAll()

  const response = NextResponse.redirect(
    new URL('/login?signed_out=1', getBaseUrl()),
    { status: 303 },
  )

  for (const c of all) {
    if (/^sb-|supabase|auth-token/i.test(c.name)) {
      response.cookies.set({
        name: c.name,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    }
  }

  return response
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  )
}

export const GET = handleLogout
export const POST = handleLogout

export const dynamic = 'force-dynamic'
