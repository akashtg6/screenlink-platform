'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { authService } from '@/services/auth'

interface AuthContextValue {
  session: Session | null
  user: User | null
  organization: Organization | null
  role: Role | null
  roleSlug: RoleSlug | null
  loading: boolean
  signIn: (c: Credentials) => Promise<void>
  signUp: (p: SignUpPayload) => Promise<Session | null>
  signInWithGoogle: (redirect?: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resetPassword: (newPassword: string) => Promise<void>
  updateProfile: (patch: ProfileUpdate) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    authService
      .getSession()
      .then((s) => {
        if (mounted) {
          setSession(s)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setLoading(false)
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
    if (s) setSession(s)
    return s
  }, [])

  const signInWithGoogle = useCallback(async (redirect?: string) => {
    await authService.signInWithGoogle(redirect)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const redirectUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?type=recovery` : ''
    await authService.sendPasswordReset(email, redirectUrl)
  }, [])

  const resetPassword = useCallback(async (newPassword: string) => {
    await authService.resetPassword(newPassword)
  }, [])

  const updateProfile = useCallback(async (patch: ProfileUpdate) => {
    const updatedUser = await authService.updateProfile(patch)
    setSession((prev) => (prev ? { ...prev, user: updatedUser } : prev))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      organization: session?.organization ?? null,
      role: session?.role ?? null,
      roleSlug: session?.role.slug ?? null,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      resetPassword,
      updateProfile,
    }),
    [session, loading, signIn, signUp, signInWithGoogle, signOut, sendPasswordReset, resetPassword, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
