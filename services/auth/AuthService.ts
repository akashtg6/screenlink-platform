import type { Credentials, Session, SignUpPayload, User } from '@/types'

/**
 * AuthService is a provider-agnostic interface.
 * The concrete implementation (Supabase, Cognito, mock, etc.)
 * MUST NOT leak into the UI layer.
 */
export interface AuthService {
  getSession(): Promise<Session | null>
  signIn(credentials: Credentials): Promise<Session>
  signUp(payload: SignUpPayload): Promise<Session>
  signOut(): Promise<void>
  updateProfile(patch: Partial<User>): Promise<User>
  onAuthStateChange(cb: (session: Session | null) => void): () => void
}
