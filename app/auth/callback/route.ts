import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * OAuth / magic-link / password-recovery callback.
 * Supabase redirects here with `?code=...` (PKCE) or `?type=recovery`.
 * We exchange the code for a session and then redirect the user to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorDescription = searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    )
  }

  if (!code) {
    // Password recovery links may arrive without a code depending on flow;
    // send the user to /reset-password to enter a new password.
    if (type === 'recovery') return NextResponse.redirect(`${origin}/reset-password`)
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }
    return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/dashboard'}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }
}
