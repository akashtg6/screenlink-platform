import { createBrowserClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client for use in Client Components only.
 * Handles PKCE OAuth flow and session persistence via cookies.
 */
let _client: SupabaseClient | null = null

export function getBrowserSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new SupabaseNotConfiguredError()
  }

  _client = createBrowserClient(url, key, {
    cookieOptions: {
      // PKCE-friendly cookie configuration; secure in prod
      sameSite: 'lax',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      path: '/',
    } as CookieOptions,
  })

  return _client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export class SupabaseNotConfiguredError extends Error {
  code = 'SUPABASE_NOT_CONFIGURED'
  constructor() {
    super(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env and restart the server.',
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}
