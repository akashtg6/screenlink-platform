# Release v0.6.1 — Index

📦 **Release title:** Engineering Interaction Foundation
🗓️ **Date:** 14 Jul 2025
🎯 **Scope:** Sprint 7 Phase 7.1 + Phase 7.2
⏸️ **Sprint status:** Paused after 7.2 per CTO directive. Sprint 7 Phase 7.3 blocked pending production verification & CTO approval.

## Documents in this folder

| File | Purpose |
|---|---|
| `RELEASE-NOTES.md` | Customer / stakeholder-facing narrative + full feature list. |
| `CHANGED-FILES.md` | Engineering diff — what changed, what didn't. |
| `TEST-REPORT.md` | Vitest results, coverage matrix, regression proof. |
| `PERFORMANCE-REPORT.md` | Bundle-size delta, build time, runtime FPS, snap engine complexity. |

## Pre-flight checklist (all ✅ before you push)

- [x] `yarn tsc --noEmit` → 0 errors
- [x] `yarn test:engine` → 225 / 225 tests pass
- [x] `yarn build` → clean production build (17 routes, 36 s)
- [x] Runtime smoke on `/workspace-preview` → rulers, zoom pill, minimap, status bar, all toolbar icons render
- [x] Auth routes untouched (`git diff v0.6.0..HEAD -- app/(auth) middleware.ts services/auth` returns empty)
- [x] Dashboard / Projects / Settings untouched (same check)
- [x] Command Bus / Event Bus / Workspace Engine core files untouched
- [x] Database schema untouched (`supabase/**` unchanged)
- [x] No new npm dependencies (`package.json` unchanged)

## Deployment steps (owner: user via Emergent UI)

1. **Save to GitHub** — click the "Save to GitHub" button in the Emergent sidebar. This will push all changes to `main` on your project repository.
2. **Vercel** — auto-deploys from `main`. No env variables to update. Wait for the green check.
3. **Tag** — once Vercel is green, tag the deployed commit `v0.6.1` in the GitHub UI. Release title: `v0.6.1 — Engineering Interaction Foundation`. Description: paste the "Executive summary" section of `RELEASE-NOTES.md`.
4. **Smoke on prod** — log in → open any project → click "Workspace" → confirm rulers visible, drag one cabinet near another (guides should appear), Ctrl+Z (should undo).
5. **CTO ✅** — send this folder to CTO for approval before Phase 7.3.

## Post-deploy verification checklist (owner: CTO or you)

- [ ] Production URL loads without console errors.
- [ ] Login works (Google + email).
- [ ] Project list, detail, edit, workspace pages all render.
- [ ] Workspace `/projects/[id]/workspace`: rulers visible on top + left.
- [ ] Workspace: zoom pill shows current %.
- [ ] Workspace: bottom status bar shows live cursor + selection count.
- [ ] Workspace: drag a cabinet → smart guides appear when close to a neighbour.
- [ ] Workspace: ALT during drag → guides disappear (raw movement).
- [ ] Workspace: SHIFT during drag → constrained to one axis.
- [ ] Workspace: Ctrl+Z undoes a drag correctly.
- [ ] Workspace: keyboard shortcuts work (1 = fit, 0 = reset, ⇧1 = zoom to selection).
- [ ] Workspace: Save button still saves — refresh the tab and confirm state persists.
- [ ] Vercel Analytics shows no new 5xx errors in the first hour.
