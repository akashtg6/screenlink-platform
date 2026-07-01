'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Credentials, Session, SignUpPayload, User } from '@/types'
import { authService } from '@/services/auth'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (credentials: Credentials) => Promise<void>
  signUp: (payload: SignUpPayload) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    authService.getSession().then((s) => {
      if (mounted) {
        setSession(s)
        setLoading(false)
      }
    })
    const unsub = authService.onAuthStateChange((s) => setSession(s))
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const signIn = useCallback(async (c: Credentials) => {
    const s = await authService.signIn(c)
    setSession(s)
  }, [])

  const signUp = useCallback(async (p: SignUpPayload) => {
    const s = await authService.signUp(p)
    setSession(s)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    const u = await authService.updateProfile(patch)
    setSession((prev) => (prev ? { ...prev, user: u } : prev))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [session, loading, signIn, signUp, signOut, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
