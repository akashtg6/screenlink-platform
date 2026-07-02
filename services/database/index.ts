import type { DatabaseService } from './DatabaseService'
import { MockDatabaseService } from './MockDatabaseService'
import { SupabaseDatabaseService } from './SupabaseDatabaseService'

/**
 * Provider-agnostic database service.
 * Uses Supabase when configured; falls back to local mock for dev/screenshots.
 */
function chooseService(): DatabaseService {
  const hasKeys =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return hasKeys ? new SupabaseDatabaseService() : new MockDatabaseService()
}

export const databaseService: DatabaseService = chooseService()
export type { DatabaseService, ProjectFilter } from './DatabaseService'
