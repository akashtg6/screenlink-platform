import type { DatabaseService } from './DatabaseService'
import { MockDatabaseService } from './MockDatabaseService'

export const databaseService: DatabaseService = new MockDatabaseService()

export type { DatabaseService, ProjectFilter } from './DatabaseService'
