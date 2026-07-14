# v0.6.1 — Test Report

## Summary

| Metric | Value |
|---|---:|
| Test framework | **Vitest 1.6** |
| Test files | **24** |
| Total tests | **225** |
| Passed | **225** ✅ |
| Failed | **0** |
| Skipped | **0** |
| Wall-clock runtime | **~1.7 s** |
| Setup overhead | ~8.1 s (module transpile) |
| CI budget | ✅ under 15 s total |

## Delta from v0.6.0

| | v0.6.0 | v0.6.1 | Δ |
|---|--:|--:|--:|
| Test files | 21 | 24 | **+3** |
| Tests | 160 | 225 | **+65** |
| Coverage of workspace store actions | partial | **full** | |
| Coverage of snap engine | 0 | **13 tests** | |
| Coverage of alignment engine | partial | **+7 tests** | |

## Per-suite breakdown (green ✅)

### New in v0.6.1
| Suite | Tests | Time |
|---|--:|--:|
| `engines/workspace-engine/tests/smart-snap.test.ts` | **13** | 45 ms |
| `engines/workspace-engine/tests/alignment-sprint7.test.ts` | **7** | 34 ms |
| `features/workspace/canvas/tests/viewport-math.test.ts` | **23** | 10 ms |
| `features/workspace/canvas/tests/store-sprint7.test.ts` | **12** | 43 ms |
| `features/workspace/canvas/tests/store-snap.test.ts` | **10** | 39 ms |
| **Sub-total (new)** | **65** | ~171 ms |

### Existing (still green)
| Suite | Tests | Time |
|---|--:|--:|
| `commercial-engine/tests/commercial-engine.test.ts` | 15 | 59 ms |
| `engines/workspace-engine/tests/engine.test.ts` | 14 | 37 ms |
| `features/workspace/canvas/tests/engine.test.ts` | 22 | 51 ms |
| `boq-engine/tests/boq-engine.test.ts` | 6 | 6 ms |
| `engineering-engine/tests/validation.test.ts` | 12 | 4 ms |
| `engineering-engine/tests/wizard-adapter.test.ts` | 7 | 5 ms |
| `engineering-engine/tests/rules-recommendations.test.ts` | 8 | 140 ms |
| `features/workspace/commands/tests/command-bus.test.ts` | 4 | 30 ms |
| `proposal-engine/tests/proposal-engine.test.ts` | 7 | 106 ms |
| `engineering-engine/tests/aspect-ratio.test.ts` | 12 | 7 ms |
| `proposal-engine/tests/reports.test.ts` | 5 | 50 ms |
| `engineering-engine/tests/power-weight-viewing.test.ts` | 10 | 35 ms |
| `engineering-engine/tests/resolution.test.ts` | 9 | 4 ms |
| `engineering-engine/tests/engine.test.ts` | 6 | 45 ms |
| `engineering-engine/tests/screen-geometry.test.ts` | 9 | 4 ms |
| `engineering-engine/tests/cabinet.test.ts` | 3 | 32 ms |
| `engineering-engine/tests/pixel-density.test.ts` | 6 | 4 ms |
| `engineering-engine/tests/performance.test.ts` | 2 | 57 ms |
| `excel-engine/tests/excel-engine.test.ts` | 3 | 210 ms |
| **Sub-total (existing)** | **160** | ~886 ms |

## Coverage matrix (Sprint 7 features vs tests)

| Feature | Test file(s) | Green? |
|---|---|:---:|
| Screen ↔ world math | `viewport-math.test.ts` | ✅ |
| Fit-bounds viewport | `viewport-math.test.ts` | ✅ |
| Dynamic grid step | `viewport-math.test.ts` | ✅ |
| Grid opacity fade | `viewport-math.test.ts` | ✅ |
| Ruler tick generator | `viewport-math.test.ts` | ✅ |
| Marquee threshold | `viewport-math.test.ts` | ✅ |
| Zoom % formatter | `viewport-math.test.ts` | ✅ |
| `zoomIn / zoomOut / setZoom` | `store-sprint7.test.ts` | ✅ |
| `zoomToSelection` | `store-sprint7.test.ts` | ✅ |
| `selectAllVisible` respects hidden layers | `store-sprint7.test.ts` | ✅ |
| `invertSelection` | `store-sprint7.test.ts` | ✅ |
| `resetViewport` | `store-sprint7.test.ts` | ✅ |
| Rulers / Minimap toggles | `store-sprint7.test.ts` | ✅ |
| Canvas background presets | `store-sprint7.test.ts` | ✅ |
| Space-pressed flag lifecycle | `store-sprint7.test.ts` | ✅ |
| Edge snap (L/R/T/B) | `smart-snap.test.ts` | ✅ |
| Centre snap (X/Y) | `smart-snap.test.ts` | ✅ |
| Equal-spacing detection | `smart-snap.test.ts` | ✅ |
| Grid-snap fallback | `smart-snap.test.ts` | ✅ |
| Screen-pixel threshold (varies with zoom) | `smart-snap.test.ts` | ✅ |
| ALT disable | `smart-snap.test.ts`, `store-snap.test.ts` | ✅ |
| SHIFT axis-lock | `smart-snap.test.ts`, `store-snap.test.ts` | ✅ |
| Guides `from…to` range spans both boxes | `smart-snap.test.ts` | ✅ |
| Drag → snap → commit → undo | `store-snap.test.ts` | ✅ |
| `toggleSmartSnap` gates pipeline | `store-snap.test.ts` | ✅ |
| `equalGap` (with & without explicit gap) | `alignment-sprint7.test.ts`, `store-snap.test.ts` | ✅ |
| `centerOnCanvas` (undoable) | `alignment-sprint7.test.ts`, `store-snap.test.ts` | ✅ |

## What was NOT unit-tested (by design, per sprint MVP scope)

The following were verified only via runtime smoke because they depend on the DOM / Konva / react-konva rendering layer (Playwright is scheduled for the end of Sprint 7):

- Rulers component paint (verified via Chrome screenshot)
- Zoom indicator popover visual (verified via Chrome screenshot)
- Marching-ants animation frame rate (visual only — 60 fps in Chrome DevTools)
- Space-drag pan cursor swap (visual)
- Smart-guides overlay drawn during real drag (verified via drag test)

These are queued for Playwright coverage in Phase 7.4.

## Regression check

`git diff v0.6.0..HEAD -- app/(auth) app/dashboard app/projects app/settings services middleware.ts` returns empty (0 lines changed), and all pre-existing tests continue to pass — confirming no regressions in auth, dashboard, project CRUD or settings.
