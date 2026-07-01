import type {
  Credentials,
  ProfileUpdate,
  Session,
  SignUpPayload,
  User,
} from '@/types'

/**
 * Provider-agnostic authentication contract.
 *
 * UI and business-logic code MUST depend on this interface, never on a
 * concrete implementation. Additional providers (SAML, WorkOS, Cognito, …)
 * can be added without touching consumers.
 */
export interface AuthService {
  /** Returns the current session or null. */
  getSession(): Promise<Session | null>

  /** Email + password sign-in. */
  signIn(credentials: Credentials): Promise<Session>

  /** Email + password sign-up. Creates an org + engineer profile via DB trigger. */
  signUp(payload: SignUpPayload): Promise<Session | null>

  /** Redirects the browser to the Google OAuth consent screen. */
  signInWithGoogle(redirectPath?: string): Promise<void>

  /** Terminates the current session. */
  signOut(): Promise<void>

  /** Sends a password-reset email that links back to `redirectUrl`. */
  sendPasswordReset(email: string, redirectUrl: string): Promise<void>

  /** Updates the current user's password (called from the reset-password page). */
  resetPassword(newPassword: string): Promise<void>

  /** Updates the current user's profile. */
  updateProfile(patch: ProfileUpdate): Promise<User>

  /** Subscribes to session changes; returns an unsubscribe fn. */
  onAuthStateChange(cb: (session: Session | null) => void): () => void
}

export class AuthErrorImpl extends Error {
  code: string
  status?: number
  constructor(message: string, code = 'AUTH_ERROR', status?: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.status = status
  }
}
