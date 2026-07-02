# ScreenLink.ai — Engineering Engine (Sprint 4B, v4B.0.0)

> **Purpose:** A framework-agnostic, pure-TypeScript engineering engine that
> converts a `ProjectData` DTO into a fully-populated `EngineeringResult`.
> The engine is the *only* source of truth for engineering numbers in the UI —
> **UI code must never calculate**.

## Architectural rules (non-negotiable)

1. The engine is **pure TypeScript** — no React, no Supabase, no DOM APIs.
2. The engine is **stateless** — same input → same output.
3. The engine is **framework-agnostic** — can run in Node, workers, edge, tests.
4. Only `core/calculate-engineering.ts` is a public entry. All calculators are
   exported for advanced use but the wizard should call `calculateEngineering`.
5. Recommendations, warnings and scores originate from the **Rules Engine** —
   *never* hardcoded inside React components.

## Folder structure (post-4B)

```
engineering-engine/
├── core/
│   └── calculate-engineering.ts        # single public entry point (v4B.0.0)
├── calculators/                        # 4A + 4B calculators
│   ├── aspect-ratio.ts                 # M1 (4A)
│   ├── screen-geometry.ts              # M2 (4A)
│   ├── resolution.ts                   # M3 (4A)
│   ├── pixel-density.ts                # M4 (4A)
│   ├── cabinet.ts                      # M1 (4B) — Cabinet Engine
│   ├── power.ts                        # M2 (4B) — Power Engine
│   ├── weight.ts                       # M3 (4B) — Weight Engine
│   └── viewing.ts                      # M4 (4B) — Viewing Engine
├── rules/                              # M5 (4B) — Rules Engine
│   ├── rules-engine.ts                 # evaluator
│   └── default-rules.ts                # library of engineering rules
├── recommendations/                    # M6 (4B) — Recommendation Engine
│   └── recommendation-engine.ts
├── scoring/                            # M7 (4B) — Engineering Score
│   └── engineering-score.ts
├── validators/
│   └── project-data-validator.ts       # M8 (4B) — full-input validator
├── react/
│   └── use-engineering.ts              # M9 (4B) — React memoisation hook
├── constants/                          # frozen tables
│   ├── aspect-ratios.ts
│   ├── resolutions.ts
│   ├── units.ts
│   └── engineering-defaults.ts         # POWER/WEIGHT/VIEWING/BRIGHTNESS/PITCH tables
├── models/                             # public typed contracts
│   ├── project-data.ts                 # ENGINE INPUT
│   └── engineering-result.ts           # ENGINE OUTPUT
├── utils/
│   └── math.ts                         # gcd, round, clamp, unit converters
├── tests/                              # Vitest — 84 tests, 100% passing
│   ├── aspect-ratio.test.ts
│   ├── screen-geometry.test.ts
│   ├── resolution.test.ts
│   ├── pixel-density.test.ts
│   ├── cabinet.test.ts
│   ├── power-weight-viewing.test.ts
│   ├── rules-recommendations.test.ts
│   ├── validation.test.ts
│   ├── engine.test.ts
│   ├── performance.test.ts
│   └── wizard-adapter.test.ts
├── docs/
│   ├── README.md                       # (Sprint 4A doc, still valid)
│   ├── ENGINEERING-ENGINE.md           # ← this file
│   ├── FORMULA-LIBRARY.md              # every formula, with rationale
│   └── ENGINEERING-RULES.md            # every rule, why it fires, how it scores
└── index.ts                            # PUBLIC API (only file consumers import)
```

## Data flow

```
ProjectData ─▶ validate ─┬─▶ 4A calculators ─▶ 4B calculators ─▶ rules ─▶ recs ─▶ score
                            │
                            └── (critical errors short-circuit with empty result)
```

1. **Validation** (`validators/project-data-validator.ts`) — hard errors
   (missing width/height/pitch) short-circuit with an empty result.
2. **4A chain** — geometry → aspect ratio → resolution → pixel density.
3. **4B chain** — cabinet layout → power → weight → viewing.
4. **Rules** — evaluate the full `DEFAULT_RULES` array against `ProjectData`
   plus the intermediate result. `critical` findings become `errors`, others
   become `warnings`.
5. **Recommendations** — de-duplicated actionable suggestions with a `reason`,
   `engineeringExplanation`, `suggestedAction`, `confidence` and `priority`.
6. **Score** — 0–100 with a letter grade (A/B/C/D/F) and per-category
   breakdown (display design, viewing, installation, power, maintainability).

## Public API

```ts
import {
  calculateEngineering,          // single entry — call this from adapters
  ENGINE_VERSION,                // '4B.0.0'

  // Advanced / diagnostic use — individual calculators
  calculateAspectRatio, calculateScreenGeometry,
  calculateResolution, calculatePixelDensity,
  calculateCabinetLayout, calculatePower, calculateWeight, calculateViewing,

  // Rules, recommendations, score (usually consumed via calculateEngineering)
  evaluateRules, findingsToMessages,
  DEFAULT_RULES, suggestedPitchForApplication,
  generateRecommendations,
  computeEngineeringScore,

  // Constants
  POWER_DEFAULTS, WEIGHT_DEFAULTS, VIEWING_DEFAULTS,
  BRIGHTNESS_DEFAULTS, PITCH_SUGGESTIONS,

  // React helper (client-side only)
  useEngineering,

  // Types
  type ProjectData, type EngineeringResult,
  type EngineeringMessage,
  type CabinetLayout, type PowerResult, type WeightResult, type ViewingResult,
  type Recommendation, type EngineeringScore,
  type EngineeringRule, type RuleFinding,
} from '@/engineering-engine'
```

## Modules — quick reference

### M1 (4A) Aspect Ratio — `calculators/aspect-ratio.ts`
Computes the closest standard aspect ratio (16:9, 21:9, 32:9, 4:3, 1:1, 9:16 …).

### M2 (4A) Screen Geometry — `calculators/screen-geometry.ts`
Converts to mm, then computes diagonal (mm and inches), area (m²), perimeter and
detects orientation.

### M3 (4A) Resolution — `calculators/resolution.ts`
Derives pixel counts and classifies against HD/FHD/2K/QHD/4K/DCI-4K/5K/8K.

### M4 (4A) Pixel Density — `calculators/pixel-density.ts`
pixels/m, pixels/m², PPI, and total LED count for BOQ.

### M1 (4B) Cabinet Engine — `calculators/cabinet.ts`
Given cabinet size and screen size, computes tiling (h × v cabinets), used
vs unused area, `efficiencyPercent`, and — when < 95% — suggests a nearest
divisor cabinet size that tiles the screen exactly.

### M2 (4B) Power Engine — `calculators/power.ts`
`W/m²` from `POWER_DEFAULTS` × display family, times area for max watts, times
content-type factor for typical watts. Daily/monthly/annual kWh derived from
`operationHoursPerDay`.

### M3 (4B) Weight Engine — `calculators/weight.ts`
`kg/m²` from `WEIGHT_DEFAULTS` × display family × area. Per-cabinet weight
when cabinet count is known. Structural (kN, CoG) reserved for Sprint 5.

### M4 (4B) Viewing Engine — `calculators/viewing.ts`
Pitch × 1 / × 3 / × 30 rule → min, recommended, max distance. Comfort score
0–100 and fitness label `too_close | ok | ideal | too_far | unspecified`.

### M5 (4B) Rules Engine — `rules/rules-engine.ts` + `rules/default-rules.ts`
Data-driven rules with `when`, `message`, `suggestion`, `recommendation`,
`explanation`. Rules are **data**, not code inside components. See
[ENGINEERING-RULES.md](./ENGINEERING-RULES.md) for the full library.

### M6 (4B) Recommendation Engine — `recommendations/recommendation-engine.ts`
Consumes rule findings + raw signals to produce **de-duplicated, prioritised**
actionable recommendations with a `reason`, `engineeringExplanation`,
`suggestedAction` and `confidence`. Every recommendation explains **why**.

### M7 (4B) Engineering Score — `scoring/engineering-score.ts`
0–100 with letter grade. Deductions per finding by severity. Category weights:
30% display design, 25% viewing, 20% installation, 15% power, 10% maintain.

### M8 (4B) Validation — `validators/project-data-validator.ts`
Extended validation with warnings for out-of-range values.

### M9 (4B) Dashboard Integration — `react/use-engineering.ts` and
`features/projects/wizard/engineering-summary-panel.tsx`
React hook that memoises `calculateEngineering` per input. UI panel renders
score + categories + calculations + findings + recommendations, live, next to
the wizard. Adapter at `lib/engineering/wizard-to-engine.ts` maps wizard values
to `ProjectData`.

## Determinism, purity & performance

- Same input → same numeric output (verified by `is deterministic` tests).
- All engines share a common **round-and-return** discipline via `utils/math.ts`.
- Full pipeline (all 4B modules) runs in **< 1 ms/call** typical, **< 10 ms**
  worst-case (validated by `performance.test.ts` and the 1000-iteration test
  in `rules-recommendations.test.ts`).

## Testing

```bash
yarn test:engine        # vitest run (11 files, 84 tests)
yarn test:engine:watch  # watch mode
yarn test:engine:cov    # v8 coverage report
```

**Status (Sprint 4B):** ✅ 11/11 test files, 84/84 tests passing.

## Extending the engine

Each future engine (Structural, BOQ, Proposal, AI Assistant) MUST:

1. Live under its own folder inside `engineering-engine/` (or a sibling module).
2. Depend only on `ProjectData` and previously-computed `EngineeringResult`
   fields — never on React, DOM or Supabase.
3. Extend `EngineeringResult` via **additive** optional properties — never
   introduce breaking changes.
4. Ship with tests + docs + rule entries **before** merging.
5. Bump `ENGINE_VERSION` in `core/calculate-engineering.ts` for any changes to
   defaults, formulas or the rules library.
