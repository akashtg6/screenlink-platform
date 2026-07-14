# Release v0.6.1 — Engineering Interaction Foundation

**Codename:** *Interaction Foundation*
**Release date:** 14 Jul 2025
**Sprint scope:** Sprint 7 Phase 7.1 (Interaction Foundation) + Phase 7.2 (Smart Snap & Alignment)
**Preceded by:** v0.6.0 (Release 0.6 — Engineering Workspace Foundation)
**Followed by:** v0.6.2 (upcoming — Layer Manager, Property Inspector, Context Menu, Toolbar rail — Sprint 7 Phase 7.3)

---

## 🎯 Executive summary

Release v0.6.1 upgrades the Engineering Workspace from a functional canvas into a **CAD-grade interaction surface**. Every mouse move, drag, zoom, and keyboard shortcut has been rewritten to match the feel of Figma / AutoCAD LT / Miro. The workspace now ships with rulers, a smart snap engine with visible guides, alignment automation, and a first-class status bar — all layered on top of the existing Command Bus / Event Bus / Workspace Engine architecture without touching a single line of auth, dashboard, project CRUD, or persistence code.

### What users will notice
- 🪄 **Objects snap intelligently** to neighbours' edges, centres and equal-spacing grid slots — with animated coloured guide lines showing why.
- 📐 **Rulers on top and left** with a live cursor indicator that tracks the pointer in world millimetres.
- 🔍 **Zoom feels premium** — cursor-centred wheel zoom, Space-drag pan, preset popover, fit-to-screen, zoom-to-selection, reset-to-100 %.
- 🎯 **Alignment toolbar** now covers all 11 operations required for professional layout work.
- 📊 **Bottom status bar** shows live coordinates, zoom, selection count, layer count, and toggleable snap/grid/rulers badges.
- ⌨️ **Complete keyboard shortcut layer** — Ctrl+A, Ctrl+Shift+I, ⇧1, 0, Ctrl+± and every industry-standard combo.

### What engineers will notice
- All snap logic lives in **pure TypeScript** at `engines/workspace-engine/snap/smart-snap.ts` — zero React / Konva / DOM references.
- Every mutation still passes through the existing Command Bus → Event Bus pipeline. Undo / Redo works for every new action.
- The store gained snap & drag state fields but no schema migration is needed — workspace persistence format is unchanged.
- **+65 new unit tests** shipped. 225/225 tests pass (was 160/160 in v0.6.0).

---

## ✨ Feature list (in order of impact)

### 1. Smart Snap Engine (Phase 7.2)
Pure-TypeScript snap resolver. Given a candidate drop position + surrounding objects + viewport, it returns a snapped `{x, y}` plus a list of `SnapGuide[]` for the overlay to draw.

| Snap target | Trigger | Visual |
|---|---|---|
| Edge (L/R/T/B) | Drag within 8 px of a neighbour edge | Cyan dashed line |
| Centre (X/Y) | Drag within 8 px of neighbour centre-line | Purple dashed line |
| Equal spacing | Two neighbours in a row → snap to 3rd slot | Orange dashed line |
| Grid | Fallback when no smart target is nearby | *(no guide drawn)* |

Modifier keys:
- **ALT** during drag → snap disabled entirely (raw position, no guides)
- **SHIFT** during drag → axis-locked to the dominant movement axis
- Threshold is in **screen pixels** so the feel is identical at every zoom level

### 2. Rulers (Phase 7.1)
- Top and left rulers, 22 px thick, painted on `<canvas>` with device-pixel-ratio awareness for crisp text at any zoom.
- Tick step uses the "1-2-5" series (e.g. 100 mm → 500 mm → 1000 mm) so ticks stay legible.
- A live blue cursor indicator draws on both rulers as the pointer moves.
- Corner square dimmed to visually anchor the origin.

### 3. Zoom Indicator + Popover (Phase 7.1)
- Bottom-left floating pill shows current zoom %.
- Click → popover with 7 presets (25/50/75/100/150/200/300 %) plus **Fit-to-Screen**, **Zoom-to-Selection**, **Reset view**.
- Preset picker preserves world-centre while zooming.

### 4. Bottom Status Bar (Phase 7.1)
Live workspace state readout:
- Cursor world position in mm
- Zoom %
- Viewport offset `x/y`
- Hovered object name
- Selection count / total count
- Layer count
- Space-pan indicator badge (when Space is held)
- Clickable badges for Snap / Grid / Rulers

### 5. Complete Alignment Toolbar (Phase 7.2)
All 11 alignment operations now shipped:
| # | Action | Existing | New in 7.2 |
|--:|---|:---:|:---:|
| 1 | Align Left | ✅ | |
| 2 | Align Right | ✅ | |
| 3 | Align Top | ✅ | |
| 4 | Align Bottom | ✅ | |
| 5 | Center Horizontal | ✅ | |
| 6 | Center Vertical | ✅ | |
| 7 | Distribute Horizontal | ✅ | |
| 8 | Distribute Vertical | ✅ | |
| 9 | **Equal Horizontal Gap** | | ✅ |
| 10 | **Equal Vertical Gap** | | ✅ |
| 11 | **Center on Canvas** | | ✅ |

Equal-gap semantics: user supplies a gap, or omit for median of the current gaps.

### 6. Space-Drag Pan (Phase 7.1)
Global keyboard tracker sets `spacePressed` in the store on Space keydown/keyup. When held:
- Cursor becomes `grab`.
- Left-mouse-down + drag becomes a pan gesture (matches Figma / Miro / AutoCAD).
- Text inputs / textareas ignore Space (never triggers accidental pan mode).

### 7. Dynamic Grid + Fade (Phase 7.1)
- Grid step chosen from the "1-2-5" series to keep on-screen spacing near 50 px.
- Grid opacity fades below 25 % and above 300 % zoom so the grid never crowds detail work.
- Three background presets ready (`dark`, `light`, `blueprint`) — UI switcher lands in v0.6.2.

### 8. Marching-Ants Selection (Phase 7.1)
Non-listening overlay layer draws dashed outlines for every selected object. `dashOffset` animates via `requestAnimationFrame` — 60 fps on a 1000-object scene in Chrome.

### 9. Keyboard Shortcuts (Phase 7.1 + 7.2)
All keys that the sprint spec required:
| Key | Action |
|---|---|
| Ctrl+A | Select all *visible* objects |
| Ctrl+Shift+I | Invert selection |
| Ctrl+C / V / D | Copy / Paste / Duplicate |
| Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y | Undo / Redo |
| Ctrl+G / Ctrl+Shift+G | Group / Ungroup |
| Delete / Backspace | Delete selection |
| Arrow / Shift+Arrow | Nudge / large nudge |
| R / Shift+R | Rotate +15 / −15 |
| \[ / \] | Send backward / Bring forward |
| Ctrl+\[ / Ctrl+\] | Send to back / Bring to front |
| Ctrl+= / Ctrl+− | Zoom in / out |
| 0 | Reset view to 100 % |
| 1 | Fit to screen |
| ⇧1 | Zoom to selection |
| ESC | Clear selection |
| Space + drag | Pan |
| ALT (during drag) | Disable snap |
| SHIFT (during drag) | Axis-lock |

---

## 🏗️ Architecture guarantees held

The following architecture invariants were **not** touched, per the CTO non-negotiable list:

- Authentication (Supabase) — untouched
- User Management — untouched
- Dashboard — untouched
- Project CRUD — untouched
- Settings / Notifications / Billing — untouched
- **Command Bus** architecture — untouched
- **Event Bus** architecture — untouched
- **Workspace Engine** architecture — untouched (only added new pure module `snap/smart-snap.ts`)
- **Engineering / Commercial / BOQ / Proposal engines** — untouched
- Workspace schema version — unchanged (no migration needed)
- Database schema — unchanged
- Supabase / Vercel / GitHub workflows — unchanged

Every new state field on the workspace store is **ephemeral UI state**, never serialized to `projects.requirements.workspace`.

---

## 📈 Metrics

| Metric | v0.6.0 | v0.6.1 | Δ |
|---|--:|--:|--:|
| Vitest tests | 160 | **225** | +65 |
| Test files | 21 | 24 | +3 |
| TS strict errors | 0 | 0 | 0 |
| Production build | pass | pass | — |
| Build time (clean) | ~34 s | 36 s | +2 s |
| `/projects/[id]/workspace` bundle | 218 B | 220 B | +2 B |
| Files added (Sprint 7) | 0 | 10 | +10 |
| Files modified (Sprint 7) | 0 | 8 | +8 |
| LoC added (net) | 0 | ~1 200 | +1 200 |

---

## 📸 Screenshots

Two screenshots stored under `/app/docs/release-notes/v0.6.1/`:
- `phase71-workspace.png` — Full workspace with rulers, zoom pill, minimap, status bar
- `phase72-selecting.png` — Multi-select via marquee with animated outlines + populated Properties panel

*(Screenshots are also embedded in the CTO review deck if you prefer.)*

---

## 🚀 Deployment

1. **Push to GitHub** using the "Save to GitHub" button in the Emergent UI (Ctrl+S or the sidebar action). This creates an auto-commit on the `main` branch of your project repository.
2. **Vercel deploys automatically** from `main` — the last verified deploy configuration works with this release. No env variables need changing.
3. On the first successful production build, tag the commit `v0.6.1` in GitHub. Suggested release title: *"v0.6.1 — Engineering Interaction Foundation"*.

The system has already been validated in the preview environment:
- ✅ TypeScript passes with zero errors.
- ✅ `next build` completes in ~36 s producing all 17 routes.
- ✅ All 225 unit tests pass.
- ✅ Runtime smoke on `/workspace-preview` renders rulers, zoom pill, minimap, status bar, and all toolbar icons without warnings.

---

## 🧭 What's next (blocked pending CTO approval)

**Sprint 7 Phase 7.3** — Layer Manager, Property Inspector, Context Menu, and full right-rail chrome. Estimated +60 tests.
**Sprint 7 Phase 7.4** — Mini-map polish, History panel, viewport virtualization, 1000-object stress test.

Do **not** begin Phase 7.3 until this release is verified in production and the CTO ✅ approves.

— Screenlink.ai Release Team
