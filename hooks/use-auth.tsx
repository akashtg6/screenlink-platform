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
    let receivedFirstEvent = false
    const t0 = performance.now()

    // Hard failsafe — the loading state can NEVER outlive this budget. After
    // 10 s we let the UI render whatever we currently know (typically null).
    // This is a defence-in-depth guard: with the retries below, we usually
    // clear loading in < 500 ms.
    const failsafe = setTimeout(() => {
      if (!mounted) return
      // eslint-disable-next-line no-console
      console.warn('[auth] failsafe timeout — clearing loading after 10s')
      setLoading(false)
    }, 10_000)

    // 1) Initial hydration — resolve loading regardless of outcome.
    authService
      .getSession()
      .then((s) => {
        if (!mounted) return
        // eslint-disable-next-line no-console
        console.info(`[auth] getSession resolved in ${(performance.now() - t0).toFixed(0)}ms, session=${s ? 'yes' : 'no'}`)
        setSession(s)
        setLoading(false)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[auth] initial getSession failed:', err)
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
      })

    // 2) Realtime auth events — ALSO clear loading so the UI can't stall
    //    if Supabase fires SIGNED_IN / INITIAL_SESSION before/after the
    //    initial promise settles.
    const unsub = authService.onAuthStateChange((s) => {
      if (!mounted) return
      // eslint-disable-next-line no-console
      console.info(`[auth] onAuthStateChange fired at ${(performance.now() - t0).toFixed(0)}ms, session=${s ? 'yes' : 'no'}, first=${!receivedFirstEvent}`)
      setSession(s)
      if (!receivedFirstEvent) {
        receivedFirstEvent = true
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(failsafe)
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
