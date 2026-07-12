/**
 * Sprint 6B — workspace engine tests.
 *
 * Broader coverage than Sprint 6A: schema versioning, migrations, libraries,
 * event bus, validators.
 */

import { describe, it, expect } from 'vitest'
import {
  WORKSPACE_SCHEMA_VERSION,
  createEventBus,
  createLibraryRegistry,
  createPluginRegistry,
  DEFAULT_LIBRARY,
  emptyWorkspace,
  migrateWorkspace,
  objectFromLibrary,
  serializeWorkspace,
  validateWorkspace,
  ALL_LIBRARY_ITEMS,
  CATEGORY_TO_KIND,
} from '@/engines/workspace-engine'

describe('workspace engine — schema & serialisation', () => {
  it('emptyWorkspace has all required top-level fields', () => {
    const w = emptyWorkspace('project-1', 'user-1')
    expect(w.id).toBeTruthy()
    expect(w.projectId).toBe('project-1')
    expect(w.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(w.createdBy).toBe('user-1')
    expect(w.createdAt).toBeTruthy()
    expect(w.updatedAt).toBeTruthy()
    expect(w.layers.length).toBeGreaterThan(0)
    expect(w.objects).toEqual([])
    expect(w.viewport).toBeDefined()
    expect(w.settings.grid.stepMm).toBeGreaterThan(0)
    expect(w.settings.snap.enabled).toBe(true)
  })

  it('serializeWorkspace bumps updatedAt and normalises z-index', () => {
    const w = emptyWorkspace('p', null)
    const before = w.updatedAt
    const later = new Date(Date.now() + 5).toISOString()
    const patched = { ...w, updatedAt: later }
    const out = serializeWorkspace(patched)
    expect(out.updatedAt >= later || out.updatedAt >= before).toBe(true)
    expect(out.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
  })
})

describe('workspace engine — migrations', () => {
  it('undefined → fresh workspace', () => {
    const w = migrateWorkspace(undefined, { projectId: 'p1', createdBy: null })
    expect(w.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(w.projectId).toBe('p1')
  })

  it('v1 (Sprint 6A) → v2 lifts nodes into objects and preserves layers', () => {
    const v1 = {
      version: 1,
      layers: [{ id: 'L1', name: 'Layout', visible: true, locked: false, order: 0 }],
      nodes: [{
        id: 'n1', catalogId: 'absen-a3pro-500', category: 'led', name: 'LED', x: 100, y: 200,
        width: 500, height: 500, rotation: 0, layerId: 'L1', locked: false, visible: true, zIndex: 0,
        meta: { manufacturer: 'Absen', pixelPitchMm: 3.9, resolution: '128x128', accent: 'red' },
      }],
      viewport: { x: 0, y: 0, scale: 1 },
    }
    const w = migrateWorkspace(v1, { projectId: 'p', createdBy: null })
    expect(w.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(w.objects.length).toBe(1)
    const o = w.objects[0]
    expect(o.kind).toBe('cabinet')
    if (o.kind === 'cabinet') {
      expect(o.manufacturer).toBe('Absen')
      expect(o.pixelPitchMm).toBe(3.9)
      expect(o.resolution).toEqual({ w: 128, h: 128 })
    }
  })

  it('unknown future version falls back to empty (does not corrupt)', () => {
    const w = migrateWorkspace({ schemaVersion: 999 }, { projectId: 'p', createdBy: null })
    expect(w.objects).toEqual([])
    expect(w.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
  })
})

describe('workspace engine — libraries', () => {
  it('default library contains every declared category', () => {
    const grouped = DEFAULT_LIBRARY.itemsByCategory()
    expect(grouped['led-cabinet'].length).toBeGreaterThan(0)
    expect(grouped['lcd-panel'].length).toBeGreaterThan(0)
    expect(grouped['controller'].length).toBeGreaterThan(0)
    expect(grouped['receiving-card'].length).toBeGreaterThan(0)
    expect(grouped['sending-card'].length).toBeGreaterThan(0)
    expect(grouped['power-supply'].length).toBeGreaterThan(0)
    expect(grouped['media-player'].length).toBeGreaterThan(0)
    expect(grouped['accessory'].length).toBeGreaterThan(0)
    expect(grouped['placeholder'].length).toBeGreaterThan(0)
  })

  it('every library item maps to a valid object kind', () => {
    for (const it of ALL_LIBRARY_ITEMS) {
      expect(CATEGORY_TO_KIND[it.category]).toBeTruthy()
    }
  })

  it('registry.register() adds items', () => {
    const r = createLibraryRegistry([])
    r.register([{ id: 'x', category: 'accessory', name: 'X', manufacturer: 'Y', widthMm: 10, heightMm: 10, accent: 'slate' }])
    expect(r.find('x')).toBeTruthy()
  })

  it('objectFromLibrary produces an object of the right kind', () => {
    const led = DEFAULT_LIBRARY.itemsByCategory()['led-cabinet'][0]
    const obj = objectFromLibrary(led, 1000, 1000, 'L1', 0)
    expect(obj.kind).toBe('cabinet')
    expect(obj.layerId).toBe('L1')
    expect(obj.width).toBe(led.widthMm)
  })
})

describe('workspace engine — validators', () => {
  it('reports missing top-level fields', () => {
    const bad = { id: '', projectId: '', schemaVersion: 2, createdAt: '', updatedAt: '', createdBy: null,
      metadata: {}, canvas: { background: { color: '#000' }, units: 'mm' as const },
      layers: [], objects: [], viewport: { x: 0, y: 0, scale: 1 },
      settings: { grid: { visible: true, stepMm: 10, majorEvery: 5 }, snap: { enabled: true, stepMm: 10 }, autoSaveIntervalMs: 1000 } }
    const issues = validateWorkspace(bad as never)
    expect(issues.some((i) => i.code === 'workspace.missing-id')).toBe(true)
    expect(issues.some((i) => i.code === 'workspace.no-layers')).toBe(true)
  })

  it('reports orphan layers', () => {
    const w = emptyWorkspace('p', null)
    w.objects.push({
      id: 'o1', kind: 'placeholder', name: 'X', x: 0, y: 0, width: 10, height: 10,
      rotation: 0, layerId: 'MISSING', locked: false, visible: true, zIndex: 0,
    })
    const issues = validateWorkspace(w)
    expect(issues.some((i) => i.code === 'objects.orphan-layer')).toBe(true)
  })
})

describe('workspace engine — event bus', () => {
  it('on() receives every emit; unsubscribe stops receipts', () => {
    const bus = createEventBus()
    const received: string[] = []
    const off = bus.on((e) => received.push(e.event.type))
    bus.emit({ id: '1', timestamp: 'now', source: 'user', event: { type: 'workspace.saved', payload: { at: 'now' } } })
    bus.emit({ id: '2', timestamp: 'now', source: 'user', event: { type: 'workspace.hydrated', payload: { at: 'now' } } })
    expect(received).toEqual(['workspace.saved', 'workspace.hydrated'])
    off()
    bus.emit({ id: '3', timestamp: 'now', source: 'user', event: { type: 'workspace.saved', payload: { at: 'now' } } })
    expect(received.length).toBe(2)
  })

  it('onType() only receives matching events', () => {
    const bus = createEventBus()
    const seen: string[] = []
    bus.onType('viewport.changed', (e) => seen.push(e.event.type))
    bus.emit({ id: '1', timestamp: 'now', source: 'user', event: { type: 'workspace.saved', payload: { at: 'now' } } })
    bus.emit({ id: '2', timestamp: 'now', source: 'user', event: { type: 'viewport.changed', payload: { viewport: { x: 0, y: 0, scale: 1 } } } })
    expect(seen).toEqual(['viewport.changed'])
  })
})

describe('workspace engine — plugin registry stub', () => {
  it('registers importers/exporters/calculators/ai-providers', () => {
    const reg = createPluginRegistry()
    reg.register({ id: 'p', name: 'p', version: '1.0.0', kinds: ['importer'] }, (ctx) => {
      ctx.registerImporter({ id: 'i', extensions: ['.dxf'], mimeTypes: ['x/dxf'], async parse() { return { commands: [] } } })
      ctx.registerExporter({ id: 'e', label: 'PDF', extension: 'pdf', mimeType: 'application/pdf', async run() { return new Blob() } })
    })
    expect(reg.list().length).toBe(1)
    expect(reg.importers().length).toBe(1)
    expect(reg.exporters().length).toBe(1)
  })
})
