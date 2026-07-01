import type { AuthService } from './AuthService'
import type { Credentials, Session, SignUpPayload, User } from '@/types'

const STORAGE_KEY = 'screenlink.session'

function now() {
  return new Date().toISOString()
}
function inDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  if (typeof window === 'undefined') return
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('screenlink:auth-changed'))
}

function fakeToken() {
  return 'sl_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export class MockAuthService implements AuthService {
  async getSession() {
    // simulate small latency
    await new Promise((r) => setTimeout(r, 50))
    return readSession()
  }

  async signIn({ email }: Credentials): Promise<Session> {
    await new Promise((r) => setTimeout(r, 400))
    const user: User = {
      id: 'usr_' + email.split('@')[0],
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role: 'engineer',
      organization: 'ScreenLink Engineering',
      jobTitle: 'Display Solutions Engineer',
      createdAt: now(),
    }
    const session: Session = { user, token: fakeToken(), expiresAt: inDays(7) }
    writeSession(session)
    return session
  }

  async signUp({ email, name, organization }: SignUpPayload): Promise<Session> {
    await new Promise((r) => setTimeout(r, 500))
    const user: User = {
      id: 'usr_' + Math.random().toString(36).slice(2, 10),
      email,
      name,
      role: 'engineer',
      organization: organization || 'Independent',
      jobTitle: 'Display Solutions Engineer',
      createdAt: now(),
    }
    const session: Session = { user, token: fakeToken(), expiresAt: inDays(7) }
    writeSession(session)
    return session
  }

  async signOut() {
    await new Promise((r) => setTimeout(r, 100))
    writeSession(null)
  }

  async updateProfile(patch: Partial<User>): Promise<User> {
    const current = readSession()
    if (!current) throw new Error('Not authenticated')
    const user = { ...current.user, ...patch }
    writeSession({ ...current, user })
    return user
  }

  onAuthStateChange(cb: (session: Session | null) => void) {
    const handler = () => cb(readSession())
    if (typeof window !== 'undefined') {
      window.addEventListener('screenlink:auth-changed', handler)
      window.addEventListener('storage', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('screenlink:auth-changed', handler)
        window.removeEventListener('storage', handler)
      }
    }
  }
}
