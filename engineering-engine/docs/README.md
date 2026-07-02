# ScreenLink.ai — Engineering Engine (Sprint 4A)

## Purpose

A framework-agnostic, pure-TypeScript engineering engine that converts
**ProjectData** into a **EngineeringResult**. Everything is deterministic,
side-effect-free, and testable without any React, Supabase, or DOM context.

> **Rule:** The UI must never perform calculations. Any number a user sees
> must originate from `calculateEngineering(ProjectData)`.

## Folder structure

```
engineering-engine/
├── core/
│   └── calculate-engineering.ts        # single public entry point
├── calculators/
│   ├── aspect-ratio.ts                 # Module 1
│   ├── screen-geometry.ts              # Module 2
│   ├── resolution.ts                   # Module 3
│   └── pixel-density.ts                # Module 4
├── validators/
│   └── project-data-validator.ts       # Module 5
├── models/
│   ├── project-data.ts                 # ENGINE INPUT type
│   └── engineering-result.ts           # ENGINE OUTPUT type
├── types/                              # (co-located in models/ + index.ts)
├── constants/
│   ├── aspect-ratios.ts
│   ├── resolutions.ts
│   └── units.ts
├── utils/
│   └── math.ts                         # gcd, round, clamp, toMm, mmToInch, mmToM
├── tests/
│   ├── aspect-ratio.test.ts
│   ├── screen-geometry.test.ts
│   ├── resolution.test.ts
│   ├── pixel-density.test.ts
│   ├── validation.test.ts
│   ├── engine.test.ts
│   └── performance.test.ts
├── docs/
│   └── README.md                       # this file (module reference below)
└── index.ts                            # PUBLIC API — the only file consumers import
```

## Architecture diagram

```
         ┌─────────────────────────────────────────────────────┐
         │ UI / Wizard / API adapter (React, Next.js, Supabase, etc)   │
         └─────────────────────────┬──────────────────────────────────────┘
                            │  maps to ProjectData (pure DTO)
                            ▼
         ┌─────────────────────────────────────────────────────┐
         │            calculateEngineering(ProjectData)                │  ← SINGLE ENTRY
         │   (core/calculate-engineering.ts)                           │
         └───┬───────────────────┬──────────────────┬─────────────────┐
             │                     │                      │                 │
             ▼                     ▼                      ▼                 ▼
     ┌───────────────┐  ┌─────────────────┐    ┌──────────────┐   ┌───────────────┐
     │  validators/  │  │ calculators/    │    │ calculators/ │   │ calculators/  │
     │  ProjectData  │  │ aspect-ratio   │    │ screen-geo   │   │ resolution +  │
     │  validator    │  │                 │    │              │   │ pixel-density │
     └──────┬───────┘  └─────────┬────────┘    └───────┬──────┘   └───────┬───────┘
            │              │                      │                 │
            └─────────────┴──────────────────────┬──────────────────┴───────────────┐
                                                     ▼                              │
                                        ┌────────────────────────────┐        │
                                        │  EngineeringResult          │   ◀──────┘
                                        │  (single, typed, immutable) │
                                        └────────────────────────────┘
```

## Public API

```ts
import {
  calculateEngineering,          // main entry point
  calculateAspectRatio,          // module 1 (advanced use)
  calculateScreenGeometry,       // module 2
  calculateResolution,           // module 3
  calculatePixelDensity,         // module 4
  validateProjectData,           // module 5
  type ProjectData,
  type EngineeringResult,
} from '@/engineering-engine'
```

## Module 1 — Aspect Ratio

**Inputs:** `width: number`, `height: number` (any consistent unit), optional tolerance.
**Outputs:** `AspectRatioResult` — `actualRatio`, `closestStandard`, `closestStandardRatio`, `toleranceFraction`, `isStandard`, `reducedName`, `humanReadable`, `explanation`.
**Formula:** `actualRatio = width / height`; nearest match to `STANDARD_ASPECT_RATIOS` by absolute ratio difference; GCD reduction gives the `reducedName`.
**Example:** `calculateAspectRatio(1920, 1080)` → `16:9 (1.78:1)`.
**Edge cases:** rejects zero/negative/non-finite; supports custom tolerance.
**Future:** anamorphic ratios, storyboarding cinema standards.

## Module 2 — Screen Geometry

**Inputs:** `width`, `height`, `unit: MeasurementUnit`.
**Outputs:** `widthMm`, `heightMm`, `diagonalMm`, `diagonalInch`, `areaSqM`, `perimeterMm`, `orientationDetected`.
**Formula:** `diagonal = √(w² + h²)`; `area = w · h`; `perimeter = 2(w + h)`.
**Example:** 6.4 m × 3.6 m → diagonal ≈ 7.34 m (≈ 289 in), area = 23.04 m².
**Edge cases:** rejects zero/negative; supports `mm`, `cm`, `m`, `inch`, `ft`.
**Future:** curved / concave / convex geometry (arc-length area).

## Module 3 — Resolution

**Inputs:** `widthMm`, `heightMm`, `pixelPitchMm`.
**Outputs:** `horizontalPixels`, `verticalPixels`, `totalPixels`, `megapixels`, `class` (HD / Full HD / 2K / QHD / UHD 4K / DCI 4K / 5K / 8K / Custom), `shortName`, `nominal`, `explanation`.
**Formula:** `pixels = floor(length_mm / pitch_mm)`; classification via nearest-neighbour to `RESOLUTION_CLASSES` within 10% tolerance on both axes.
**Example:** 1920 mm × 1080 mm @ P1.0 → 1920×1080 → Full HD (FHD, 2.07 MP).
**Edge cases:** rejects zero/negative; floors partial pixels.
**Future:** interlaced modes, sub-pixel LED counts.

## Module 4 — Pixel Density

**Inputs:** `pixelPitchMm`, `horizontalPixels`, `verticalPixels`.
**Outputs:** `pixelsPerMeter`, `pixelsPerSquareMeter`, `pixelDensityPPI`, `totalLEDs`.
**Formulae:** `ppm = 1000 / pitch`; `ppi = 25.4 / pitch`; `pp² = ppm²`; `totalLEDs = h · v` (one RGB pixel per LED module).
**Example:** P1.9 → 526 pixels/m, 13.4 PPI, 277k pixels/m².
**Edge cases:** rejects zero pitch or negative pixel counts; zero pixels allowed.
**Future:** sub-pixel counts (×3 for R/G/B), driver-IC count.

## Module 5 — Validation

**Inputs:** full `ProjectData`.
**Outputs:** `{ errors, warnings, info }` — arrays of `EngineeringMessage`.
**Rules:**
- Errors: missing / zero / negative dimensions or pitch.
- Warnings: dimensions outside `LIMITS` (100 mm – 200 m), pitch outside 0.3 – 40 mm, operation hours outside 0–24.
- Info: cabinet does not tile evenly with screen dimensions.
**Example:** cabinet 500×500 mm inside a 6400×3600 screen → `CABINET_DOES_NOT_TILE`.
**Future:** brightness vs environment cross-checks, viewing angle vs orientation.

## Determinism, purity & performance

Each calculator:
- has **no side effects** (no I/O, no globals, no Date except in the engine wrapper for the timestamp),
- takes **primitives** and returns **plain objects**,
- is **stateless** and **thread-safe** in principle,
- **executes in < 5 ms** (see `tests/performance.test.ts`).

## How to run tests

```bash
yarn test:engine        # single run
yarn test:engine:watch  # watch mode
yarn test:engine:cov    # with v8 coverage report
```

## Extending the engine (Sprint 4B and beyond)

Each future engine (Cabinet, Power, Weight, Recommendation, Proposal, AI
Assistant) MUST:
1. Live under its own folder inside `engineering-engine/` (or a sibling module).
2. Depend only on `ProjectData` and previously-computed `EngineeringResult` fields.
3. Extend `EngineeringResult` via **additive** properties — never breaking changes.
4. Ship with tests + docs before merge.
