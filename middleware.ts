import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

// Route classification
const PUBLIC_PATHS = new Set<string>(['/', '/login', '/signup', '/forgot-password', '/reset-password'])
const PUBLIC_PREFIXES = ['/auth/', '/api/', '/_next/', '/favicon']

// Anywhere requiring an authenticated user
const PROTECTED_PREFIXES = ['/dashboard', '/projects', '/settings', '/configurator', '/proposals', '/team', '/help', '/admin']

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast path for static assets
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const { response, user, configured } = await updateSession(request)

  // If Supabase isn't configured, allow all requests (dev mode) and log once.
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[ScreenLink] Supabase is not configured. Auth middleware is in fail-open mode. ' +
          'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env to enable auth.',
      )
    }
    return response
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect signed-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Everything except Next internals, images and static files
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
