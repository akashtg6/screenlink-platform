import type { AuthService } from './AuthService'
import { SupabaseAuthService } from './SupabaseAuthService'

/**
 * The single concrete AuthService instance for the entire application.
 *
 * Swap this line to introduce a new provider without touching UI or business logic:
 *   export const authService: AuthService = new WorkOSAuthService()
 */
export const authService: AuthService = new SupabaseAuthService()

export type { AuthService } from './AuthService'
export { AuthErrorImpl } from './AuthService'
