# ScreenLink.ai — Engineering Workspace Architecture

**Document type:** Architecture blueprint (no production code)
**Owner:** Lead Software Architect
**Applies to:** Release v0.6 and forward (5-year horizon)
**Status:** DRAFT — awaiting founder approval before Sprint 6B implementation
**Date:** June 2025 (revised for Release 0.6)

---

## 0. Executive summary

The Engineering Workspace is ScreenLink.ai's flagship product surface — a Figma-class interactive canvas that unifies engineering design, calculations, BOQ, commercial modelling, and proposal generation into a single visual workspace. Sprint 6A shipped the *foundation* (drag, drop, select, layers, undo, autosave). This document defines the architecture that everything from Sprint 6B onwards will be built on, so we can add:

- Auto engineering calculations against a live layout
- BOQ + commercial + proposal generation from the layout
- AI layout assistant
- Realtime multi-user collaboration
- Version history + branching
- DXF / PDF / image import + export
- Third-party plugins (manufacturers, importers, calculators)

…without ever having to re-plumb the core.

**Core architectural principles**
1. **Pure logic ↔ pure UI, always separated.** Engines (TS) know nothing of React; UI knows nothing of business rules.
2. **Every mutation is a Command.** Commands are serialisable, invertible, replayable. This single abstraction unlocks undo, macros, plugins, realtime sync, and AI.
3. **Normalised store, sliced selectors.** One `Map<id, Node>` — never an array. Nodes re-render only when their own row changes.
4. **Pluggable everything.** Renderer, persistence, catalog, calculators, exporters, AI provider — all behind interfaces, all swappable.
5. **Migrate schema last.** JSONB blob today; dedicated tables only when the object model has stabilised.

---

## 1. Architecture diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Next.js client)                         │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                        PRESENTATION LAYER (React)                     │    │
│  │                                                                       │    │
│  │  Toolbars   │   Panels          │   Overlays          │   Modals      │    │
│  │  (Top,      │  (Toolbox,        │  (measure guide,    │  (Import,     │    │
│  │  Floating)  │   Properties,     │   snap ghost,       │   Export,     │    │
│  │             │   Layers,         │   selection HUD)    │   Version)    │    │
│  │             │   Outline, AI)    │                     │               │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                              ↑ hooks read slices ↑                            │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                    RENDERING LAYER  (react-konva)                     │    │
│  │  CanvasStage → Layer(grid CSS) · Layer(nodes) · Layer(overlays)       │    │
│  │  Culling · caching · Transformer · marquee · minimap                  │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                              ↑ subscribeWithSelector ↑                        │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                    INPUT / INTERACTION LAYER                          │    │
│  │  keyboard · pointer · wheel · drop · gesture (touch)                  │    │
│  │              ↓ dispatch(command) ↓                                    │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                        COMMAND BUS (core)                             │    │
│  │  execute · invert · replay · batch · broadcast(collab)                │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                              ↓ mutates store ↓                                │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                     WORKSPACE STORE (Zustand)                         │    │
│  │  nodes: Map · layers · viewport · selection · clipboard · history     │    │
│  │  (single source of truth; normalised; sliced)                         │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                       ENGINES (pure TS, no React)                     │    │
│  │  workspace-engine · engineering · commercial · boq · proposal ·       │    │
│  │  rules · dxf · ai · pdf · excel                                       │    │
│  │  (unit-tested in Vitest; run in main thread or Web Worker)            │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                   PLUGIN REGISTRY (extension points)                  │    │
│  │  importers · exporters · calculators · catalogs · AI providers        │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                    PERSISTENCE / SYNC LAYER                           │    │
│  │  autosave · snapshot · diff · migration · realtime broadcast          │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                              ↓ Repository ↓                                   │
└───────────────────────────────────────────────────────────────────────────────┘
                                     ↓ HTTPS / WebSocket
                     ┌───────────────────────────────────┐
                     │           SUPABASE                │
                     │  Postgres · Auth · Storage        │
                     │  Realtime · RLS                   │
                     └───────────────────────────────────┘
```

**Data flow (drag a cabinet):**
`pointerdown → input layer → dispatch(MoveNodesCommand) → command bus → store mutation → selector notifies subscribed <CabinetShape/> → Konva repaints one shape → autosave debounces → persistence writes JSONB`

**Undo flow:** `⌘Z → dispatch(Undo) → history.pop → command.invert().execute() → store rewinds`

**AI flow (future):** `Ask AI → ai-engine.suggest(workspace) returns Command[] → user Accept → dispatch each command (batched, in history)`

**Collab flow (future):** `local dispatch → also broadcast to peers → peers receive command → dispatch(replay=true) → their store updates → each shape re-renders`

---

## 2. Folder structure

Two top-level rules:
- **`engines/`** — pure TypeScript, no React, no browser APIs. 100% Vitest-covered.
- **`features/`** — React + browser. May consume engines, never the other way around.

```
/app
├── engines/                             ── PURE TS. UI-agnostic. Web-Worker-safe.
│   ├── workspace-engine/                ── NEW. geometry, snap, hit-test, alignment,
│   │   ├── geometry/                       distribution, layout algorithms, group ops
│   │   ├── selection/                      (extracted from features/workspace/canvas/engine.ts)
│   │   ├── layout/
│   │   ├── serialization/
│   │   ├── migrations/
│   │   ├── tests/
│   │   └── index.ts
│   ├── rules-engine/                    ── NEW. rule DSL, diagnostics, auto-fixes
│   │   ├── rules/{geometry,electrical,safety,aesthetics}
│   │   ├── diagnostics.ts
│   │   ├── autofix.ts
│   │   └── tests/
│   ├── engineering-engine/              ── EXISTS. LED/LCD calculations, scoring
│   ├── commercial-engine/               ── EXISTS. pricing model
│   ├── boq-engine/                      ── EXISTS. BOQ generation
│   ├── proposal-engine/                 ── EXISTS. proposal document builder
│   ├── pdf-engine/                      ── EXISTS. @react-pdf/renderer wrapper
│   ├── excel-engine/                    ── EXISTS. exceljs wrapper
│   ├── dxf-engine/                      ── NEW. DXF read/write, layer mapping
│   ├── ai-engine/                       ── NEW. LLM-agnostic client, prompt templates,
│   │                                       command-batch parser (LLM output → Command[])
│   └── adapters/                        ── NEW. Workspace → ProjectData, Workspace → BOQInput
│
├── features/                            ── REACT UI. Feature-scoped.
│   ├── auth/                            ── EXISTS
│   ├── projects/                        ── EXISTS
│   ├── workspace/                       ── THE FLAGSHIP
│   │   ├── canvas/                         renderer + input
│   │   │   ├── components/                   WorkspaceShell, CanvasStage,
│   │   │   │                                 CabinetShape, GroupShape, ImageShape
│   │   │   ├── konva/                        thin react-konva wrappers
│   │   │   ├── input/                        keyboard, pointer, wheel, touch, drop
│   │   │   ├── rendering/                    grid painter, minimap, off-screen culler
│   │   │   ├── selection/                    marquee, transformer, hit-test glue
│   │   │   └── viewport/                     zoom/pan/fit hooks
│   │   ├── panels/                           Toolbox, Properties, Layers, Outline, Issues
│   │   ├── toolbars/                         Top toolbar + contextual floating toolbars
│   │   ├── overlays/                         measurement, guides, snap indicators, HUD
│   │   ├── commands/                         command definitions (align, move, group…)
│   │   ├── history/                          undo/redo UI hooks
│   │   ├── clipboard/                        copy/paste/duplicate
│   │   ├── catalog/                          Cabinet catalog UI (data in workspace-engine)
│   │   ├── persistence/                      autosave, snapshot, migrations, conflict
│   │   ├── collaboration/                    (future) presence, cursors, CRDT bridge
│   │   ├── history-panel/                    (future) version timeline UI
│   │   ├── ai-assistant/                     (future) chat panel; talks to ai-engine
│   │   ├── import/                           DXF/image/PDF import UI (calls dxf-engine)
│   │   ├── export/                           PDF/DXF/Excel/PNG export UI
│   │   ├── plugins/                          plugin registry + built-in loaders
│   │   ├── hooks/                            useNode, useSelection, useViewport, useCommand
│   │   ├── stores/                           canvas.ts, selection.ts, viewport.ts,
│   │   │                                     history.ts, catalog.ts, ui.ts (all Zustand)
│   │   ├── services/                         workspace-repository, snapshot-service,
│   │   │                                     realtime-service (all behind interfaces)
│   │   ├── types/                            re-exports engines/workspace-engine types
│   │   └── index.ts                          public entry
│   ├── engineering/                       (future) engineering results panel
│   ├── commercial/                        (future) pricing sidebar
│   ├── proposals/                         (future) proposal generation UI
│   └── ...
│
├── components/                          ── DESIGN SYSTEM (shadcn + brand)
├── services/                            ── CROSS-CUTTING SERVICES (auth, database)
├── repositories/                        ── DOMAIN REPOSITORIES (existing)
├── hooks/                               ── CROSS-CUTTING HOOKS (existing)
├── layouts/                             ── PAGE LAYOUTS (existing)
├── types/                               ── CROSS-CUTTING TYPES
├── utils/                               ── GENERIC UTILITIES
├── lib/                                 ── THIRD-PARTY WRAPPERS (supabase, cn, etc.)
├── docs/                                ── ADRs, architecture, spec
├── supabase/                            ── migrations, seed
└── app/                                 ── NEXT.JS APP ROUTER (routes only)
```

**Migration path from Sprint 6A:**
- `features/workspace/canvas/engine.ts` → `engines/workspace-engine/` (move, no logic change).
- `features/workspace/canvas/store.ts` → `features/workspace/stores/canvas.ts` (split into per-concern stores).
- `features/workspace/canvas/components/*` → `features/workspace/canvas/components/*` (unchanged).
- Rename root-level `engineering-engine/`, `commercial-engine/`, `boq-engine/`, `proposal-engine/`, `pdf-engine/`, `excel-engine/` → move under `engines/`. Non-breaking (path aliases via `tsconfig.json`).

**Import discipline enforced by ESLint:**
- `engines/**` cannot import from `features/**` or React
- `features/**` may import from `engines/**` but not from other feature roots directly (use `services/` or public entry points)
- No circular imports

---

## 3. Object model

```ts
// —— top-level container ————————————————————————————————————————
Workspace {
  version: number                     // schema version; migrate on load
  id: string                          // UUID
  projectId: string
  name: string
  createdAt, updatedAt: ISOString
  createdBy, updatedBy: UserId
  canvas: Canvas
  metadata: {
    tags?: string[]
    notes?: string
    thumbnailUrl?: string
  }
}

// —— the drawing surface ——————————————————————————————————————
Canvas {
  viewport: Viewport                  // { x, y, scale }
  background: Background              // color, image, grid config
  grid: GridConfig                    // step, majorEvery, visible, snap
  units: 'mm' | 'cm' | 'inch' | 'm'   // display unit (world unit stays mm)
  paperSize?: PaperSize               // optional print-area marker

  layers: Layer[]                     // rendering order = layers[i].order
  nodes: Record<NodeId, Node>         // NORMALISED (Map-like)
  nodeOrder: NodeId[]                 // z-order within layers
  connections: Connection[]           // future: cabling, DMX, HDMI links
  measurements: Measurement[]         // dimension lines
  annotations: Annotation[]           // text callouts
  guides: Guide[]                     // ruler guides
}

// —— NODE (discriminated union of everything on the canvas) ————————
Node =
  | CabinetNode         // LED cabinet
  | LcdNode             // LCD/OLED panel
  | ImageNode           // reference image / floorplan
  | TextNode            // annotation label
  | ShapeNode           // primitive rectangle / ellipse / polygon
  | GroupNode           // groups other nodes
  | PlaceholderNode     // generic device (rack, camera, speaker...)

BaseNode {
  id: NodeId
  kind: string          // discriminator
  name: string
  x, y: number          // world mm (top-left)
  width, height: number // world mm
  rotation: number      // degrees, about centre
  layerId: LayerId
  locked: boolean
  visible: boolean
  zIndex: number
  groupId?: GroupId | null
  meta?: Record<string, unknown>
}

CabinetNode extends BaseNode {
  kind: 'cabinet'
  catalogId: string
  manufacturer: string
  pixelPitchMm: number
  resolution: { w: number; h: number }
  weightKg?: number
  powerW?: number
}

LcdNode extends BaseNode {
  kind: 'lcd'
  catalogId: string
  manufacturer: string
  resolution: { w: number; h: number }
  bezelMm?: number
}

ImageNode extends BaseNode {
  kind: 'image'
  src: string           // Supabase storage URL
  opacity: number
  fit: 'contain' | 'cover' | 'stretch'
}

GroupNode extends BaseNode {
  kind: 'group'
  childIds: NodeId[]
  collapsed?: boolean
}

// —— rendering primitives ———————————————————————————————————————
Layer { id, name, visible, locked, order, opacity? }
Viewport { x, y, scale }              // world→screen mapping
GridConfig { stepMm, majorEvery, visible, snap, snapStepMm }
Background { color: hex; image?: url; tint?: hex }

// —— connections + measurements ———————————————————————————————
Connection {                          // e.g. cabling between two cabinets
  id: ConnectionId
  fromNodeId: NodeId
  toNodeId: NodeId
  kind: 'power' | 'signal' | 'data' | 'custom'
  waypoints?: Point[]                  // manual routing
  meta?: Record<string, unknown>
}

Measurement {
  id: MeasurementId
  from: Point | NodeId
  to: Point | NodeId
  label?: string
  unit: 'mm' | 'cm' | 'm' | 'inch'
}

// —— editor-only state (never persisted directly with the canvas) ——
Selection {
  ids: Set<NodeId>
  focusedId?: NodeId
  transient: {                        // ephemeral drag/resize deltas
    dx?: number; dy?: number
    scaleX?: number; scaleY?: number
    rotation?: number
  }
}

Clipboard {
  version: number
  nodes: Node[]                       // deep copy w/ regenerated ids on paste
  offsetMm?: Point
}

Command {                             // the ONLY way to mutate state
  id: string                          // UUID (used for collab dedup)
  type: string                        // 'nodes.move' | 'nodes.add' | 'layer.rename' | …
  authorId?: UserId
  timestamp: ISOString
  payload: unknown                    // strongly typed per `type`
  execute(state): PatchOrState
  invert(): Command                   // reverse operation for undo
  batch?: boolean                     // coalesce with prior command
}

History {
  past: Command[]                     // capped at 50 by default
  future: Command[]
  savedCursor: number                 // last saved position
}
```

**Design notes:**
- `nodes: Record<NodeId, Node>` (not an array). O(1) lookup, and Zustand selectors can subscribe to a single node.
- Rotation is degrees, always about the node centre. AABBs computed on demand.
- Groups are a *node kind*, not a separate collection. Simpler nesting.
- Commands carry both `payload` and `invert()` — undo is `invert().execute()`, never a state snapshot.
- History is a **command log**, not a state log. Memory bounded, replayable, syncable.
- All coordinates are millimetres in world space. Viewport transforms to screen. Unit display is purely presentational.

---

## 4. State management decision

**Selected: Zustand + Command Bus.**

**Why not the alternatives:**

| Option | Verdict | Reasoning |
|---|---|---|
| React Context | ❌ | Every consumer re-renders on any change. Death for 1000 nodes. Requires massive memo effort. |
| Redux Toolkit | ❌ | Too much ceremony (actions, reducers, slices, thunks). Devtools are nice but not worth the drag on iteration speed. Every dispatch pays a middleware tax. |
| Jotai | 🟡 | Atomic model is elegant, but coordinating cross-atom updates (e.g., "delete selection" touches nodes + selection + history) forces you to build the same coordination layer we'd get from Zustand for free. |
| **Zustand** | ✅ | 3 KB, no provider, `subscribeWithSelector` for per-node subscriptions, works outside React (essential for Konva animation callbacks), immer/persist/devtools middlewares available, battle-tested by tldraw and Excalidraw for identical use cases. |

**Store topology** (five small stores instead of one god store):

1. `canvasStore` — nodes, layers, groups, connections, measurements. The domain data.
2. `selectionStore` — selectedIds, focusedId, transient drag/resize deltas. Ephemeral.
3. `viewportStore` — x, y, scale, gridVisible, snapEnabled. Persists to localStorage.
4. `historyStore` — past + future Command arrays.
5. `uiStore` — panel widths, active tool, active dialog. Persists to localStorage.

Reason for splitting: canvas mutations rebuild `nodes`; a subscribed `<Toolbox>` should *not* re-render every time a cabinet is dragged. Store isolation makes selector boundaries obvious.

**Command bus lives on top of the stores** — a small module (~150 LoC) that:
- Takes a Command, runs `execute()` (which mutates the appropriate stores),
- Pushes onto `historyStore.past`, clears `future`,
- (Future) broadcasts to peers.

The store is the *what*. The command bus is the *how you got there*. Every plugin, hotkey, UI panel, and AI response funnels through the same bus.

---

## 5. Rendering engine decision

**Selected: react-konva (HTML5 Canvas) — with an isolated renderer boundary so it can be swapped.**

**Why:**

| Option | Ceiling | React idiomaticity | Transformer / hit-test built-in | Verdict |
|---|---|---|---|---|
| HTML DOM | ~200 nodes | ✅ perfect | ❌ hand-roll | ❌ dies past 300 nodes |
| SVG | ~500 nodes | ✅ good | 🟡 partial | 🟡 good for print, bad for 1000 shapes |
| Raw Canvas 2D | 5000+ nodes | ❌ imperative | ❌ manual | 🟡 too much scaffolding |
| **Konva** | **2000-3000 nodes** | ✅ via react-konva | ✅ Transformer, HitTest | ✅ **sweet spot** |
| PixiJS (WebGL) | 10 000+ nodes | 🟡 via `@pixi/react` | ❌ no editor primitives | ❌ overkill; escape hatch if we hit ceiling |
| Fabric.js | 2000 nodes | 🟡 not React-idiomatic | ✅ | 🟡 image-editor DNA, weaker on CAD |
| React Flow | ~500 nodes | ✅ | 🟡 node-graph only | ❌ wrong DNA (node-graph, not layout) |

**Two-tier plan:**
- **Now (v0.6–v1.0):** react-konva. Meets the 1000-cabinet performance target comfortably with culling + `Konva.Group.cache()`.
- **Escape hatch:** the renderer sits inside `features/workspace/canvas/rendering/`, hidden behind a thin `IRenderer` interface. When we exceed Konva's ceiling (~2000 shapes), we swap in a PixiJS renderer *without* touching the store, commands, panels, or hotkeys. This is why the store MUST NOT contain any Konva types.

**Bonus optimisations built into the layer from day one:**
- Grid drawn with CSS `linear-gradient` (already done in 6A) — GPU-accelerated, zero Konva overhead.
- `<CabinetShape>` wrapped in `React.memo` + custom equality — a shape re-renders only when its own row changes.
- Off-screen culling: renderer computes visible-bounds AABB from viewport, filters `nodeOrder` to on-screen ids before rendering.
- Konva `perfectDrawEnabled={false}` on all shapes.
- Konva `listening={false}` on grid + overlay decoration layers.
- Heavy operations (DXF, AI, rules) run in Web Workers.

---

## 6. Database recommendation

**Verdict: KEEP the current schema. No new tables in v0.6. Plan a phased migration for v0.7–v1.0.**

### Persistence strategy: **Hybrid, phased.**

| Phase | Storage | Trigger to move | Justification |
|---|---|---|---|
| **v0.6 (now)** | `projects.requirements.workspace` **JSONB** — single blob on the projects row. | — | Zero migration. Atomic. Works today. Object model still churning. |
| **v0.7** | New table `workspaces (id, project_id, state jsonb, updated_at, version)`. One row per project. Backfill from `projects.requirements.workspace`. | Workspaces exceed ~200 KB, or we need per-workspace RLS distinct from the project. | Isolates the huge JSONB from the projects row. Enables row-level realtime subscriptions. Prep for versioning. |
| **v0.8** | Add `workspace_snapshots (id, workspace_id, created_at, author_id, message, state jsonb)`. | Version history feature request. | History as a first-class citizen. Named commits. Diff between snapshots computable off `state`. |
| **v1.0** | Add `workspace_operations (id, workspace_id, seq, author_id, command jsonb, created_at)` for CRDT / OT. | Realtime collaboration launched. | Op-log becomes the canonical history; snapshots become periodic checkpoints. |

**Why not normalised tables from day one?**
- 5-10 more schema changes are inevitable in the next 12 months. Every one is a Supabase migration + code churn + downtime risk.
- Full-load latency is fine at 200 KB JSONB. Fine-grained node updates only matter when >100 concurrent editors are collaborating in real time — not our v0.6 problem.
- Postgres JSONB with GIN indexes is queryable enough for search ("find all Absen cabinets" etc.) if we ever need it before v0.7.

**Why not pure JSONB forever?**
- Whole-row rewrites become painful past ~1 MB payload.
- Realtime subscriptions on the projects row are noisy (any project field change triggers a workspace re-broadcast).
- Snapshots inside a single JSONB column would balloon.

**Ephemeral state is browser-local (Zustand `persist` → localStorage):**
- Selection, panel widths, active tool, last viewport per project.
- Never round-trips to Postgres.

**RLS policy sketch (v0.7+):**
```
create policy "workspace read"  on workspaces for select
  using (project_id in (select id from projects where organization_id in (select organization_id from profiles where id = auth.uid())));
create policy "workspace write" on workspaces for insert, update, delete
  using (…same predicate…);
```

---

## 7. Engineering Rules Architecture

**Location:** `engines/rules-engine/` (pure TS, Web-Worker-safe).

**Separation of concerns:**
- `engines/engineering-engine/` → **computes** (given ProjectData, produce EngineeringResult with cabinet grid, power, weight, viewing score).
- `engines/rules-engine/` → **validates** (given a Workspace, produce Diagnostic[]).
- Neither engine knows about React or Konva. Both are testable in Node.

**Rule model:**
```ts
Rule {
  id: string                         // 'led.mixed-pitch', 'safety.exceeds-weight-per-m2', …
  category: 'geometry' | 'electrical' | 'safety' | 'aesthetics' | 'manufacturer'
  severity: 'error' | 'warning' | 'info'
  run(workspace: Workspace): Diagnostic[]
  autoFix?(workspace, diagnostic): Command[]   // optional fix as command batch
}

Diagnostic {
  ruleId: string
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  nodeIds: NodeId[]
  boundingBox?: Aabb
  suggestion?: string
  autoFixable: boolean
}
```

**Execution model:**
- **Reactive** — the rules engine subscribes to `canvasStore` changes (debounced 300 ms) and recomputes diagnostics. Web Worker offload once rule count grows.
- **Diagnostics** live in a separate `diagnosticsStore` (not the command bus) — they're derived state, not user actions.
- **UI surface:**
  - Issues panel (docked right, tab in the sidebar).
  - Red/amber underlines on nodes with `severity === 'error' | 'warning'`.
  - "Quick fix" button on autoFixable diagnostics dispatches the returned Command batch.

**Rule cataloguing:**
- Categories are folders inside `engines/rules-engine/rules/`.
- Rules self-register via a `RULE_REGISTRY` array (no dynamic magic). Third-party rules join via the plugin API.

**Integration with existing `engineering-engine`:**
- An adapter (`engines/adapters/workspace-to-projectdata.ts`) converts a Workspace snapshot to `ProjectData`, so the existing engineering-engine can be called against the canvas.
- The rules-engine consumes the *EngineeringResult*, so heavy math isn't duplicated.
- Reverse adapter (`projectdata-to-workspace-hints.ts`) turns engineering recommendations into overlays / autofixes.

---

## 8. Plugin architecture

**Rationale:** every long-lived design tool becomes a plugin platform (Figma, VS Code, Blender). Building the seams now costs 5% of development effort and buys us 10 years of extensibility.

**Plugin manifest:**
```ts
Plugin {
  id: string                         // 'screenlink.dxf-importer'
  name: string
  version: string                    // semver
  kind: PluginKind[]                 // may register multiple capabilities
  author?: string
  permissions?: PluginPermission[]   // 'network' | 'storage' | 'canvas.write' | …
  activate(ctx: PluginContext): Promise<void> | void
  deactivate?(): Promise<void> | void
}

PluginKind =
  | 'importer' | 'exporter' | 'calculator' | 'catalog' | 'manufacturer'
  | 'ai-provider' | 'command' | 'panel' | 'toolbar' | 'rule'

PluginContext {
  workspace: WorkspaceApi              // read-only access to state
  commands: {
    dispatch(cmd: Command): void
    register(type: string, def: CommandDef): void
  }
  catalog: {
    registerItems(items: CabinetCatalogItem[]): void
    registerLoader(loader: CatalogLoader): void
  }
  importers: { register(imp: Importer): void }
  exporters: { register(exp: Exporter): void }
  panels:    { register(p: PanelDescriptor): void }
  toolbar:   { registerAction(a: ToolbarAction): void }
  rules:     { register(r: Rule): void }
  ai:        { registerProvider(p: AiProvider): void }
  storage:   PluginStorage             // sandboxed KV store (per-plugin, per-org)
  ui:        { toast, dialog }         // ask user, confirm
}
```

**Extension points:**

| Point | Interface | Example |
|---|---|---|
| Importers | `Importer { ext, mime, parse(file) → Workspace patch }` | DXF, PDF floorplan, image trace |
| Exporters | `Exporter { id, label, run(workspace) → Blob }` | PDF, DXF, DWG, PNG, glTF |
| Calculators | `Calculator { id, run(workspace) → Result }` | Custom power/weight, sag analysis |
| Catalogs | `CatalogLoader { id, load() → Item[] }` | Absen, LG, Samsung feed |
| AI Providers | `AiProvider { id, chat, suggest(workspace) → Command[] }` | OpenAI, Gemini, Anthropic |
| Commands | `CommandDef { type, execute, invert }` | Custom domain macros |
| Rules | `Rule { … }` | Manufacturer-specific validations |
| Panels | `PanelDescriptor { side, tab, content }` | Third-party dashboard |
| Toolbar actions | `ToolbarAction { group, icon, when, run }` | Quick command shortcuts |

**Isolation model:**
- **v0.6:** built-in plugins only. Loaded via `import()` — same JS context. Trusted.
- **v1.0+:** community plugins run in an iframe sandbox with `postMessage` bridge to a whitelisted API surface. Permission prompts for network / storage. Signed manifests.

**Loading:** plugins declared in a JSON manifest (`workspace.plugins.json`) at the org level. Feature-flagged.

---

## 9. Risk assessment

Ordered by likelihood × impact:

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | **Konva scale ceiling** hit around 2000 nodes | Medium | High | Renderer isolated behind `IRenderer`. Culling + `Group.cache()` from day one. PixiJS escape hatch scoped in v0.9. |
| R2 | **Full-blob JSONB writes get slow** past ~1 MB | Medium | Medium | Persistence-level diff (Immer patches). Move to `workspaces` table in v0.7. |
| R3 | **Undo history balloons memory** | Medium | Medium | Store Command *log* not state snapshots. Cap at 50, coalesce drag frames. |
| R4 | **react-konva ↔ React version drift** (Next.js keeps bumping React) | Medium | High | Pin `react-konva@19.0.10` and `konva`. Add a CI smoke test that mounts CanvasStage on every PR. |
| R5 | **Plugin sandbox escapes / data leakage** | Low (built-ins only in v0.6) | Very high | Built-ins only until v1.0. iframe sandbox + capability model when community plugins ship. |
| R6 | **CRDT complexity for realtime collab** | High | High | Defer to v0.9+. Ship optimistic-lock save first (server-side `If-Match` on `updated_at`). Adopt Yjs when scoped, not before. |
| R7 | **AI cost explosion** if we call an LLM per interaction | High | Medium | AI is *pull* (user asks), not *push*. Batch requests. Cache prompts. Rate-limit per org. |
| R8 | **DXF quirks** (multi-vendor, 30 years of layer chaos) | High | Medium | Use `dxf-parser`/`dxf-writer`. Ship *import* first (v0.6D), *export* later (v0.7). Log unknowns for triage. |
| R9 | **Touch / mobile UX conflicts** with browser gestures | Medium | Medium | Adopt `@use-gesture/react` in v0.7. Design without touch-first, add it as a layer. |
| R10 | **RLS gaps** — workspace leakage between orgs | Medium | Very high | RLS policies on `workspaces` table via `project_id → organization_id` join. Server-side integration tests. |
| R11 | **Team merge conflicts** on the store as team grows | Medium | Medium | Strict feature-folder ownership. Store split into 5 stores (canvas, selection, viewport, history, ui). Command-bus mediation. |
| R12 | **Schema versioning** when we ship v2 of the object model | High | High | `Workspace.version` field. Migration functions in `engines/workspace-engine/migrations/`. Refuse to load unknown versions (never silently discard data). |
| R13 | **File upload for image nodes** — Supabase storage limits, quotas | Medium | Medium | Signed URLs. 25 MB per image cap. Storage bucket per org. Cleanup job for orphaned assets. |
| R14 | **Vendor lock-in to Supabase Realtime** | Low | Medium | `services/collaboration/` behind an interface; Realtime is one implementation. Swappable with Ably/Liveblocks/self-hosted. |
| R15 | **Server-driven exports (PDF/DXF)** — long-running requests, timeouts | Medium | Medium | Route exports through a queue (Vercel functions ≤ 60 s → offload to background worker on Supabase Edge or a dedicated container). |
| R16 | **Legal / IP for manufacturer catalog data** | Medium | Medium | Curated first-party catalog. Third-party catalogs opt-in per org. Store attribution + licence in `CatalogLoader.metadata`. |

**Non-risks (explicitly out of scope):**
- Rewriting the auth stack.
- Multi-DB replication.
- Migrating away from Next.js.

---

## 10. Implementation plan

Only architecture is in scope for v0.6. Sprint 6B onwards implements against this blueprint. Rough sizing:

| Sprint | Deliverable | Depends on | Size |
|---|---|---|---|
| **6B** | Refactor Sprint 6A into new folder layout. Move engine → `engines/workspace-engine/`. Introduce Command Bus + normalised node store. Migrate existing store to five focused stores. Zero user-visible changes. | Approval of this doc. | L |
| **6C** | Adapter `workspace → ProjectData`. Wire `engineering-engine` to run against the canvas. Ship "Engineering results" side panel. | 6B. | M |
| **6D** | `engines/rules-engine/` v1 with 8-12 built-in rules. Issues panel + inline diagnostics. Auto-fix for the trivial ones. | 6B, 6C. | M |
| **6E** | Image / floorplan import (`ImageNode`). Supabase storage bucket. Signed uploads. | 6B. | S |
| **6F** | Measurement tool + guides + annotations. | 6B. | M |
| **7A** | DXF import (`dxf-engine`). | 6B. | L |
| **7B** | PDF + Excel export (already have engines; UI wiring only). | 6B. | S |
| **7C** | Version history — `workspaces` + `workspace_snapshots` tables. Named commits. Diff viewer. | 6B, persistence phase 2. | L |
| **7D** | AI layout assistant — `engines/ai-engine/`. Chat panel. Command batches with preview + accept. | 6B, 6C, 6D. | L |
| **8A** | Plugin registry + built-in plugins split. | 6B. | M |
| **8B** | Realtime collaboration (Yjs or Supabase Realtime abstracted). Presence + cursors first, CRDT commands second. | 6B, 7A. | XL |

**Ordering rationale:** everything below the refactor (6B) is independent — but **without** 6B, every subsequent sprint accretes tech debt against the current Sprint 6A layout. 6B is the highest ROI move we can make in v0.6.

**Definition of "architecture approved":**
Founder signs off on §2 (folder structure), §3 (object model), §4 (state), §5 (renderer), §6 (persistence phase plan). Once approved, this document becomes the canonical reference; deviations require an ADR (`/docs/adr/NNNN-*.md`).

---

## 11. What's NOT in this document (intentionally)

- Exact UI copy / iconography — that's a design deliverable, not architecture.
- Detailed API specs for each engine — those are per-sprint deliverables.
- Marketing positioning of features — product strategy layer, above architecture.
- Pricing / packaging of AI features — commercial strategy.
- Non-canvas features (org admin, billing, reporting) — separate architecture streams.

---

## 12. Sign-off

- [ ] Folder structure approved
- [ ] Object model approved
- [ ] State management: **Zustand + Command Bus** approved
- [ ] Rendering: **react-konva** (with PixiJS escape hatch) approved
- [ ] Database: **hybrid, phased** approved (JSONB → `workspaces` in v0.7 → `snapshots` in v0.8 → `operations` in v1.0)
- [ ] Rules engine location: `engines/rules-engine/` approved
- [ ] Plugin architecture approved
- [ ] Risk register acknowledged
- [ ] Sprint 6B may begin

*End of document.*
