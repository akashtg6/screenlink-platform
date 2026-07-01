import type { AuthService } from './AuthService'
import { MockAuthService } from './MockAuthService'

// Swap this single line to change providers (e.g. new SupabaseAuthService()).
export const authService: AuthService = new MockAuthService()

export type { AuthService }
