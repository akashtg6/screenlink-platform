/**
 * Sprint 6B — Command Bus tests.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEventBus,
  emptyWorkspace,
  type Workspace,
  type CommandContext,
} from '@/engines/workspace-engine'
import {
  createCommandBus,
  addObjectsCommand,
  removeObjectsCommand,
  updateObjectsCommand,
} from '../../commands'

function ctxOf(w: Workspace): CommandContext {
  return { getWorkspace: () => w }
}

describe('command bus', () => {
  let workspace: Workspace
  let events: string[]

  beforeEach(() => {
    workspace = emptyWorkspace('p1', 'u1')
    events = []
  })

  it('dispatch emits events and pushes to history', () => {
    const bus = createEventBus()
    bus.on((e) => events.push(e.event.type))
    const cmd = createCommandBus(ctxOf(workspace), { eventBus: bus })

    cmd.dispatch(addObjectsCommand({
      objects: [{
        id: 'o1', kind: 'placeholder', name: 'X', x: 0, y: 0, width: 100, height: 100,
        rotation: 0, layerId: workspace.layers[0].id, locked: false, visible: true, zIndex: 0,
      }],
    }))
    expect(events).toEqual(['objects.added'])
    expect(cmd.canUndo()).toBe(true)
    expect(cmd.canRedo()).toBe(false)
  })

  it('undo/redo emits the inverse then the original events', () => {
    const bus = createEventBus()
    bus.on((e) => events.push(`${e.source}:${e.event.type}`))
    const cmd = createCommandBus(ctxOf(workspace), { eventBus: bus })

    cmd.dispatch(addObjectsCommand({
      objects: [{
        id: 'o1', kind: 'placeholder', name: 'X', x: 0, y: 0, width: 100, height: 100,
        rotation: 0, layerId: workspace.layers[0].id, locked: false, visible: true, zIndex: 0,
      }],
    }))
    events = []
    cmd.undo()
    expect(events[0]).toBe('undo:objects.removed')
    expect(cmd.canUndo()).toBe(false)
    expect(cmd.canRedo()).toBe(true)
    events = []
    cmd.redo()
    expect(events[0]).toBe('redo:objects.added')
  })

  it('history is bounded', () => {
    const bus = createEventBus()
    const cmd = createCommandBus(ctxOf(workspace), { eventBus: bus, historyLimit: 3 })
    for (let i = 0; i < 10; i++) {
      cmd.dispatch(updateObjectsCommand({ updates: [{ id: 'x', patch: { x: i } }] }))
    }
    expect(cmd.history().length).toBe(3)
  })

  it('remove command roundtrips with snapshot', () => {
    const bus = createEventBus()
    bus.on((e) => events.push(e.event.type))
    const cmd = createCommandBus(ctxOf(workspace), { eventBus: bus })
    cmd.dispatch(removeObjectsCommand({
      ids: ['o1'],
      snapshot: [{
        id: 'o1', kind: 'placeholder', name: 'X', x: 5, y: 5, width: 50, height: 50,
        rotation: 0, layerId: workspace.layers[0].id, locked: false, visible: true, zIndex: 0,
      }],
    }))
    expect(events[0]).toBe('objects.removed')
    cmd.undo()
    expect(events).toContain('objects.added')
  })
})
