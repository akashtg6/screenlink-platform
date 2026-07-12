/**
 * Sprint 6B — Command Bus.
 *
 * Deterministic, invertible, serialisable commands that any actor (human user,
 * AI agent, remote peer) can dispatch. Commands execute against a
 * `CommandContext` and emit `CanvasEvent[]`; the bus forwards those events to
 * the shared `workspaceEventBus`. Stores subscribe to the event bus and apply
 * changes — no direct coupling between commands and stores.
 *
 * Sprint 6B ships the bus + core commands. Sprint 6C wires additional commands
 * and refactors the store to apply *only* via commands.
 */

import {
  newCommandId,
  newEventId,
  type CanvasEvent,
  type Command,
  type CommandBus,
  type CommandContext,
  type EventBus,
  type EventSource,
  type WorkspaceObject,
} from '@/engines/workspace-engine'

interface Options {
  eventBus: EventBus
  historyLimit?: number
}

export function createCommandBus(ctx: CommandContext, opts: Options): CommandBus {
  const past: Command[] = []
  const future: Command[] = []
  const limit = opts.historyLimit ?? 50

  function emit(events: CanvasEvent[], source: EventSource): void {
    for (const event of events) {
      opts.eventBus.emit({
        id: newEventId(),
        timestamp: new Date().toISOString(),
        source,
        event,
      })
    }
  }

  return {
    dispatch(cmd, source = 'user') {
      const events = cmd.execute(ctx)
      emit(events, source)
      past.push(cmd)
      if (past.length > limit) past.shift()
      future.length = 0
    },
    undo() {
      const cmd = past.pop()
      if (!cmd) return false
      const inverse = cmd.invert(ctx)
      const events = inverse.execute(ctx)
      emit(events, 'undo')
      future.unshift(cmd)
      return true
    },
    redo() {
      const cmd = future.shift()
      if (!cmd) return false
      const events = cmd.execute(ctx)
      emit(events, 'redo')
      past.push(cmd)
      return true
    },
    canUndo() { return past.length > 0 },
    canRedo() { return future.length > 0 },
    history()  { return past.slice() },
    future()   { return future.slice() },
    clear()    { past.length = 0; future.length = 0 },
  }
}

/* -------------------------------------------------------------------------- */
/* Concrete command factories                                                  */
/* -------------------------------------------------------------------------- */

export interface MoveObjectsPayload {
  moves: Array<{ id: string; dx: number; dy: number }>
}

export function moveObjectsCommand(payload: MoveObjectsPayload, source: EventSource = 'user'): Command {
  return {
    id: newCommandId(),
    type: 'objects.move',
    timestamp: new Date().toISOString(),
    source,
    payload,
    label: `Move ${payload.moves.length} object(s)`,
    execute(): CanvasEvent[] {
      const updates = payload.moves.map(({ id, dx, dy }) => ({
        id,
        patch: { x: undefined as unknown as number, y: undefined as unknown as number } as Partial<WorkspaceObject>,
        // Store subscribers translate `moves` into absolute positions using ctx.
      }))
      return [{ type: 'objects.updated', payload: { updates } }]
    },
    invert() {
      return moveObjectsCommand(
        { moves: payload.moves.map((m) => ({ id: m.id, dx: -m.dx, dy: -m.dy })) },
        source,
      )
    },
  }
}

export interface UpdateObjectsPayload {
  updates: Array<{ id: string; patch: Partial<WorkspaceObject>; previous?: Partial<WorkspaceObject> }>
}

export function updateObjectsCommand(payload: UpdateObjectsPayload, source: EventSource = 'user'): Command {
  return {
    id: newCommandId(),
    type: 'objects.update',
    timestamp: new Date().toISOString(),
    source,
    payload,
    label: `Update ${payload.updates.length} object(s)`,
    execute(): CanvasEvent[] {
      return [{ type: 'objects.updated', payload: { updates: payload.updates.map((u) => ({ id: u.id, patch: u.patch })) } }]
    },
    invert() {
      // Requires per-update `previous` snapshot to be invertible.
      const inverseUpdates = payload.updates
        .filter((u) => u.previous)
        .map((u) => ({ id: u.id, patch: u.previous as Partial<WorkspaceObject> }))
      return updateObjectsCommand({ updates: inverseUpdates }, source)
    },
  }
}

export interface AddObjectsPayload {
  objects: WorkspaceObject[]
}

export function addObjectsCommand(payload: AddObjectsPayload, source: EventSource = 'user'): Command {
  return {
    id: newCommandId(),
    type: 'objects.add',
    timestamp: new Date().toISOString(),
    source,
    payload,
    label: `Add ${payload.objects.length} object(s)`,
    execute(): CanvasEvent[] {
      return [{ type: 'objects.added', payload: { objects: payload.objects } }]
    },
    invert() {
      return removeObjectsCommand({ ids: payload.objects.map((o) => o.id) }, source)
    },
  }
}

export interface RemoveObjectsPayload {
  ids: string[]
  /** Snapshot required for undo. */
  snapshot?: WorkspaceObject[]
}

export function removeObjectsCommand(payload: RemoveObjectsPayload, source: EventSource = 'user'): Command {
  return {
    id: newCommandId(),
    type: 'objects.remove',
    timestamp: new Date().toISOString(),
    source,
    payload,
    label: `Remove ${payload.ids.length} object(s)`,
    execute(): CanvasEvent[] {
      return [{ type: 'objects.removed', payload: { ids: payload.ids } }]
    },
    invert() {
      return addObjectsCommand({ objects: payload.snapshot ?? [] }, source)
    },
  }
}

export { newCommandId }
