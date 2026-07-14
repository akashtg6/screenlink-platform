# v0.6.1 — Changed Files Summary

Total Sprint 7 delta: **10 new + 8 modified = 18 files**. Zero deletions. Zero renames.

Nothing outside `features/workspace/` and `engines/workspace-engine/` was touched, except:
- `app/workspace-preview/page.tsx` — sandbox demo page updated to render the new chrome (Rulers / StatusBar / ZoomIndicator). Not customer-facing.

---

## ➕ Files added (10)

### Pure engine (no framework deps)
| File | Purpose | Lines |
|---|---|--:|
| `engines/workspace-engine/snap/smart-snap.ts` | Pure snap resolver: edges / centres / equal-spacing / grid fallback. Modifier-aware (ALT / SHIFT). | ~260 |
| `engines/workspace-engine/tests/smart-snap.test.ts` | 13 tests locking in every snap semantics + threshold + modifier behaviour. | ~150 |
| `engines/workspace-engine/tests/alignment-sprint7.test.ts` | 7 tests for `equalGapObjects` + `centreObjectsAt`. | ~85 |

### Canvas math + hooks
| File | Purpose | Lines |
|---|---|--:|
| `features/workspace/canvas/viewport-math.ts` | Pure viewport helpers: screen↔world, fit-bounds, dynamic grid step, grid opacity, zoom formatting, ruler tick generator, marquee threshold. | ~180 |
| `features/workspace/canvas/use-space-pan.ts` | Global Space keydown/keyup tracker → sets `spacePressed` in store. | ~55 |
| `features/workspace/canvas/tests/viewport-math.test.ts` | 24 tests for the pure viewport helpers. | ~190 |
| `features/workspace/canvas/tests/store-sprint7.test.ts` | 11 tests for new store fields + actions (zoomToSelection, selectAllVisible, invertSelection, toggles). | ~140 |
| `features/workspace/canvas/tests/store-snap.test.ts` | 10 tests for the drag/snap pipeline + alignment additions. | ~180 |

### UI components
| File | Purpose | Lines |
|---|---|--:|
| `features/workspace/canvas/components/Rulers.tsx` | Top + left rulers with live cursor indicator. Canvas-painted, DPR-aware. | ~155 |
| `features/workspace/canvas/components/ZoomIndicator.tsx` | Floating zoom pill + preset popover. | ~75 |
| `features/workspace/canvas/components/BottomStatusBar.tsx` | Live status bar (cursor / zoom / viewport / selection / snap-grid-rulers badges). | ~85 |
| `features/workspace/canvas/components/SmartGuides.tsx` | Konva overlay renderer for guides (cyan / purple / orange). | ~70 |

---

## ✏️ Files modified (8)

| File | Change | Additive? | Breaking? |
|---|---|:---:|:---:|
| `engines/workspace-engine/geometry/index.ts` | Added `equalGapObjects()` + `centreObjectsAt()`. All existing exports unchanged. | ✅ | ❌ |
| `engines/workspace-engine/snap/index.ts` | Re-exports `smart-snap`. | ✅ | ❌ |
| `features/workspace/canvas/store.ts` | New state fields (`smartSnapEnabled`, `snapThresholdPx`, `activeGuides`, `dragOrigin`, `rulersVisible`, `minimapVisible`, `canvasBackground`, `spacePressed`). New actions (`zoomIn/Out/setZoom/zoomToSelection`, `selectAllVisible/invertSelection`, `equalGap/centerOnCanvas`, `beginDrag/computeDragSnap/endDrag/clearGuides`, `toggleSmartSnap/Rulers/Minimap`, `setCanvasBackground/SpacePressed`). All old actions and state untouched. Uses `fitNodesViewport` from the new pure module (replaces inline math). | ✅ | ❌ |
| `features/workspace/canvas/components/CanvasStage.tsx` | Proper Space-drag pan (bug fix: `getModifierState('Space')` never actually returned true → replaced with global tracker). Dynamic grid step. Marching-ants overlay layer. Screen-pixel marquee threshold. `onCursorChange` / `onSize` callbacks up to parent. Cursor state (grab/grabbing/crosshair/default). `<SmartGuides />` mounted in the overlay layer. | ✅ | ❌ |
| `features/workspace/canvas/components/CabinetShape.tsx` | Drag now routes through the store's `beginDrag → computeDragSnap → endDrag` pipeline via Konva's `dragBoundFunc`. Global ALT / SHIFT tracker keeps modifier state fresh across drag frames. Existing rendering unchanged. | ✅ | ❌ |
| `features/workspace/canvas/components/WorkspaceShellCanvas.tsx` | Wires in `Rulers`, `ZoomIndicator`, `BottomStatusBar`, `useSpacePan()`. Layout re-flowed to include ruler gutter + status bar. Cursor world-position lifted into local state and passed to child components. | ✅ | ❌ |
| `features/workspace/canvas/components/TopToolbar.tsx` | New buttons: Smart-Snap toggle (Wand2), Rulers toggle, Minimap toggle, Zoom-to-Selection, Reset-view, Equal-Horizontal-Gap, Equal-Vertical-Gap, Center-on-Canvas. Actual `zoomIn/zoomOut` store actions replace inline math. `onZoomToSelection` prop added. | ✅ | ❌ |
| `features/workspace/canvas/use-canvas-hotkeys.ts` | Added Ctrl+A (visible-only), Ctrl+Shift+I (invert), ⇧1 (zoom to selection), 0 (reset), Ctrl+± (zoom). Now accepts `onZoomToSelection` in its options object. | ✅ | ⚠️ |
| `app/workspace-preview/page.tsx` | Non-customer sandbox — updated to render the new chrome so we can screenshot / demo. | ✅ | ❌ |

> ⚠️ **The only technically breaking change** is that `useCanvasHotkeys(opts)` gained a new required option `onZoomToSelection`. This hook has only two callers (`WorkspaceShellCanvas.tsx` and `app/workspace-preview/page.tsx`), both updated in the same commit. No public API affected.

---

## 🚫 Files NOT changed (per CTO non-negotiable list)

Verified via `git diff` against v0.6.0:

- `app/(auth)/**` — auth pages untouched
- `services/auth/**`, `services/database/**` — untouched
- `middleware.ts` — untouched
- `app/dashboard/**`, `app/projects/**` (list, detail, edit, new pages) — untouched
- `app/settings/**` — untouched
- `features/notifications/**` — untouched
- `engineering-engine/**`, `commercial-engine/**`, `boq-engine/**`, `proposal-engine/**` — untouched
- `engines/workspace-engine/commands/**` (Command Bus) — untouched
- `engines/workspace-engine/events/**` (Event Bus) — untouched
- `engines/workspace-engine/plugins/**` (Plugin Registry) — untouched
- `engines/workspace-engine/schema/**`, `engines/workspace-engine/migrations/**` — untouched
- `supabase/**` — untouched
- `.emergent/emergent.yml` — untouched
- `next.config.js`, `tsconfig.json`, `tailwind.config.js`, `package.json` — untouched
