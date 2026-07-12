/**
 * Sprint 6B — Workspace Engine · public barrel.
 *
 * Consumers import from `@/engines/workspace-engine` only. Every sub-module
 * remains available under its own path for tree-shaking. Nothing here depends
 * on React, browser globals, or Konva.
 */
export * from './types'
export * from './math'
export * from './geometry'
export * from './snap'
export * from './collision'
export * from './measurement'
export * from './serialization'
export * from './migrations'
export * from './validators'
export * from './events'
export * from './commands'
export * from './plugins'
export * from './libraries'
export * from './utils'
