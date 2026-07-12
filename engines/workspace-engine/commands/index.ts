/**
 * Sprint 6B — Workspace Engine · commands
 *
 * A Command is a **deterministic**, serialisable description of a state
 * mutation. It is:
 *   - executable by a human user OR a future AI OR a remote peer
 *   - invertible (for undo)
 *   - never coupled to a specific store (it emits events; stores handle)
 *
 * All command factories live in `features/workspace/commands/` because they
 * depend on the concrete stores; this module just defines the abstractions.
 */

import type { CanvasEvent, EventSource } from '../events'
import type { Workspace } from '../types'

export interface CommandContext {
  /** Read-only snapshot of the current workspace. Never mutate. */
  getWorkspace(): Workspace
}

export interface Command {
  /** Unique id used for dedup / audit / collab. */
  id: string
  /** Type slug — `objects.move`, `layer.rename`, etc. */
  type: string
  /** Time the command was created (client-local). */
  timestamp: string
  /** Who or what created the command. */
  source: EventSource
  /** Free-form payload; strongly typed by factory. */
  payload: unknown
  /** Produce the events describing this command's effect. */
  execute(ctx: CommandContext): CanvasEvent[]
  /** Return the inverse command for undo. */
  invert(ctx: CommandContext): Command
  /** Optional label for UI ("Undo: Move 4 objects"). */
  label?: string
  /** May coalesce with a preceding command of the same type. */
  coalesceKey?: string
}

export interface CommandBus {
  dispatch(cmd: Command, source?: EventSource): void
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
  /** Last N executed commands (bounded ring, useful for audit). */
  history(): ReadonlyArray<Command>
  future(): ReadonlyArray<Command>
  clear(): void
}
