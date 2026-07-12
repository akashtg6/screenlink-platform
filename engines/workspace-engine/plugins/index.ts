/**
 * Sprint 6B — Workspace Engine · plugins
 *
 * Stub registry. Actual plugin loading + sandboxing arrives in Sprint 8A.
 * We declare the extension points now so no consumer code needs to change
 * when the loader ships.
 */

import type { Command } from '../commands'
import type { LibraryItem } from '../libraries'
import type { CanvasEvent } from '../events'
import type { Workspace } from '../types'

export type PluginKind =
  | 'importer' | 'exporter' | 'calculator' | 'library' | 'manufacturer'
  | 'ai-provider' | 'command' | 'panel' | 'toolbar' | 'rule'

export interface PluginManifest {
  id: string
  name: string
  version: string
  kinds: PluginKind[]
  permissions?: PluginPermission[]
  author?: string
}

export type PluginPermission = 'network' | 'storage' | 'canvas.write' | 'library.write'

export interface Importer {
  id: string
  extensions: string[]
  mimeTypes: string[]
  parse(file: File | Blob): Promise<{ commands: Command[]; note?: string }>
}

export interface Exporter {
  id: string
  label: string
  extension: string
  mimeType: string
  run(workspace: Workspace): Promise<Blob>
}

export interface Calculator {
  id: string
  label: string
  run(workspace: Workspace): Promise<unknown>
}

export interface AiProvider {
  id: string
  chat(prompt: string, ctx: { workspace: Workspace }): Promise<{ commands?: Command[]; text?: string }>
}

export interface PluginContext {
  registerImporter(imp: Importer): void
  registerExporter(exp: Exporter): void
  registerCalculator(c: Calculator): void
  registerLibraryItems(items: LibraryItem[]): void
  registerAiProvider(p: AiProvider): void
  onEvent(handler: (e: CanvasEvent) => void): () => void
}

export interface PluginRegistry {
  register(manifest: PluginManifest, activate: (ctx: PluginContext) => void | Promise<void>): void
  list(): PluginManifest[]
  importers(): Importer[]
  exporters(): Exporter[]
  calculators(): Calculator[]
  aiProviders(): AiProvider[]
}

/** In-memory registry used until the sandboxed loader lands. */
export function createPluginRegistry(): PluginRegistry {
  const manifests: PluginManifest[] = []
  const importers: Importer[] = []
  const exporters: Exporter[] = []
  const calculators: Calculator[] = []
  const aiProviders: AiProvider[] = []

  const ctx: PluginContext = {
    registerImporter(imp)   { importers.push(imp) },
    registerExporter(exp)   { exporters.push(exp) },
    registerCalculator(c)   { calculators.push(c) },
    registerLibraryItems(_) { /* delegated to libraries registry — wired in Sprint 8A */ },
    registerAiProvider(p)   { aiProviders.push(p) },
    onEvent(_)              { return () => {} },
  }

  return {
    register(manifest, activate) {
      manifests.push(manifest)
      void activate(ctx)
    },
    list()        { return manifests.slice() },
    importers()   { return importers.slice() },
    exporters()   { return exporters.slice() },
    calculators() { return calculators.slice() },
    aiProviders() { return aiProviders.slice() },
  }
}
