/**
 * Sprint 6B — Workspace Engine · events
 *
 * Typed pub/sub used by the Command Bus. Every mutation flows:
 *
 *     User → Command.execute() → CanvasEvent[] → EventBus.emit → Stores react → UI
 *
 * The event bus is deliberately dumb: no ordering guarantees beyond the
 * standard EventTarget/queue semantics. Handlers are synchronous.
 */

import type {
  Layer, ObjectId, Viewport, WorkspaceObject, LayerId, WorkspaceSettings,
} from '../types'

export type EventSource = 'user' | 'undo' | 'redo' | 'ai' | 'remote' | 'system'

/** Discriminated union of every observable state change. */
export type CanvasEvent =
  | { type: 'objects.added';    payload: { objects: WorkspaceObject[] } }
  | { type: 'objects.updated';  payload: { updates: Array<{ id: ObjectId; patch: Partial<WorkspaceObject> }> } }
  | { type: 'objects.replaced'; payload: { objects: WorkspaceObject[] } }
  | { type: 'objects.removed';  payload: { ids: ObjectId[] } }

  | { type: 'layers.added';     payload: { layer: Layer } }
  | { type: 'layers.updated';   payload: { id: LayerId; patch: Partial<Layer> } }
  | { type: 'layers.reordered'; payload: { layers: Layer[] } }
  | { type: 'layers.removed';   payload: { id: LayerId; reassignTo: LayerId | null } }

  | { type: 'viewport.changed'; payload: { viewport: Viewport } }
  | { type: 'settings.changed'; payload: { patch: Partial<WorkspaceSettings> } }

  | { type: 'workspace.hydrated'; payload: { at: string } }
  | { type: 'workspace.saved';    payload: { at: string } }

export interface EmittedEvent {
  id: string
  timestamp: string
  source: EventSource
  event: CanvasEvent
}

export type EventListener = (e: EmittedEvent) => void

export interface EventBus {
  emit(evt: EmittedEvent): void
  on(handler: EventListener): () => void
  onType<T extends CanvasEvent['type']>(
    type: T,
    handler: (e: EmittedEvent & { event: Extract<CanvasEvent, { type: T }> }) => void,
  ): () => void
}

export function createEventBus(): EventBus {
  const all = new Set<EventListener>()
  const byType = new Map<string, Set<EventListener>>()

  return {
    emit(evt) {
      for (const fn of all) { try { fn(evt) } catch (err) { console.error('[eventBus]', err) } }
      const set = byType.get(evt.event.type)
      if (set) for (const fn of set) { try { fn(evt) } catch (err) { console.error('[eventBus]', err) } }
    },
    on(handler) { all.add(handler); return () => all.delete(handler) },
    onType(type, handler) {
      const set = byType.get(type) ?? new Set()
      set.add(handler as EventListener)
      byType.set(type, set)
      return () => set.delete(handler as EventListener)
    },
  }
}
