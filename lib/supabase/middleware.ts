import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Refresh the Supabase session on every request and expose the resulting
 * NextResponse (with cookies already updated) to the caller.
 *
 * The caller is expected to make the auth decision (redirect / allow) using
 * the returned `user`.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let response = NextResponse.next({ request })

  // Fail-open in development if not configured (so the app is still viewable).
  if (!url || !key) {
    return { response, user: null, configured: false as const }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // IMPORTANT: use getUser() (validated) not getSession() for auth decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user, configured: true as const }
}
