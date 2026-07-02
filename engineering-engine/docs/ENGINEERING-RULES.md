# Engineering Rules Library — v4B.0.0

Every warning, error and recommendation the wizard displays is produced by one
of the rules in [`rules/default-rules.ts`](../rules/default-rules.ts). Rules
are **data, not code** — the UI never authors them.

## Rule shape (from `rules/rules-engine.ts`)

```ts
interface EngineeringRule {
  id: string                   // stable code, e.g. 'PITCH_TOO_COARSE_FOR_TEXT'
  description: string
  category: 'display' | 'viewing' | 'installation' | 'power' | 'maintainability' | 'content'
  severity: 'info' | 'warning' | 'critical'
  when: (input, ctx) => boolean
  message: (input, ctx) => string
  suggestion?: (input, ctx) => string
  recommendation?: (input, ctx) => RecommendationHint | undefined
  explanation: string          // ***why*** — surfaced to the user
}
```

- `critical` severity is promoted to `errors[]` (and forces `ok: false`).
- `info` and `warning` become `warnings[]`.
- `recommendation` (if present) is picked up by the Recommendation Engine.

## The library

### R-01 · PITCH_TOO_COARSE_FOR_TEXT (display, warning)
**When:** `contentType` ∈ {control_room, powerpoint, dashboard, broadcast}
and `pixelPitchMm > 2.5`.
**Reason:** Text requires ≥ 8 vertical pixels per character. Coarser pitches
force viewers back and reduce legibility.
**Recommendation:** `pixelPitchMm → 1.9`.

### R-02 · BRIGHTNESS_TOO_LOW_OUTDOOR (display, critical)
**When:** `environment === 'outdoor'` and `brightnessNits < 4500`.
**Reason:** Outdoor ambient light averages 10 000+ lux; anything under
~4 500 nits appears washed out.
**Recommendation:** `brightnessNits → 6000`.

### R-03 · CORPORATE_NEEDS_FINE_PITCH (display, info)
**When:** `application === 'corporate'` and `pixelPitchMm > 2.5`.
**Reason:** Boardroom audiences read spreadsheets and slides at close range.
**Recommendation:** `pixelPitchMm → 1.9`.

### R-04 · STADIUM_PITCH_TOO_FINE (display, info)
**When:** `application === 'stadium'` and `pixelPitchMm < 5`.
**Reason:** Stadium viewing distances (20–80 m) mean fine pitch is invisible
and over-engineered.
**Recommendation:** `pixelPitchMm → 8`.

### R-05 · CABINET_INEFFICIENT_LAYOUT (installation, warning)
**When:** `cabinet.efficiencyPercent < 95`.
**Reason:** Uneven cabinet tiling produces unused strips at the edges and
complicates structural framing.
**Recommendation:** Adopt `cabinet.suggestedCabinet` (if the engine found one).

### R-06 · VIEWING_DISTANCE_BELOW_PITCH_RULE (viewing, warning)
**When:** `viewing.fitness === 'too_close'`.
**Reason:** The classical *3× pitch* rule keeps pixels indistinguishable at
normal visual acuity. Below `min = pitch × 1`, individual pixels are visible.
**Suggestion:** Increase viewing distance to at least the recommended
distance, or choose a finer pixel pitch.

### R-07 · VIEWING_TOO_FAR (viewing, info)
**When:** `viewing.fitness === 'too_far'`.
**Reason:** Beyond `max = pitch × 30`, angular pixel size drops below visual
acuity limits — content feels small.
**Suggestion:** Increase screen area or move viewers closer.

### R-08 · NON_STANDARD_ASPECT (content, info)
**When:** `aspectRatio.isStandard === false`.
**Reason:** Broadcast codecs, video players and CMS pipelines expect 16:9,
21:9, etc. Non-standard ratios cause scaling.
**Suggestion:** Author to the exact canvas or letterbox to a standard aspect.

### R-09 · POWER_DENSITY_HIGH (power, warning)
**When:** `power.wattsPerSqMMax > 900`.
**Reason:** Densities > 900 W/m² warrant active cooling and phase-balanced
feeds.
**Suggestion:** Coordinate with facility engineer for HVAC and phase
distribution.

### R-10 · BRIGHTNESS_UNSPECIFIED (display, info)
**When:** `brightnessNits === undefined` and an `environment` is set.
**Reason:** Brightness governs perceived contrast under ambient light.
**Recommendation:** `brightnessNits → BRIGHTNESS_DEFAULTS[environment].ideal`.

### R-11 · MAINTENANCE_ACCESS_MISSING (maintainability, warning)
**When:** `geometry.areaSqM > 10` and `extras.maintenanceAccess` is not set.
**Reason:** Rear access requires clearance behind the wall; front-access
modules cost more but are essential in wall-flush installations.
**Suggestion:** Specify front, rear or both — drives cabinet family choice.

---

## Recommendation engine — how it enriches rules

`recommendations/recommendation-engine.ts` consumes rule findings and adds
proactive suggestions that don't need a triggered rule:

- **Application-tuned pixel pitch** — if `pixelPitchMm` sits outside
  `PITCH_SUGGESTIONS[application]` range, suggest the ideal.
- **Environment brightness** — if `brightnessNits` is missing but
  `environment` is set, suggest the `BRIGHTNESS_DEFAULTS[env].ideal` value.
- **Orientation** — if `orientation` is missing, suggest `landscape` when
  the aspect ratio > 1.5, `portrait` when < 0.8.
- **Cabinet upgrade** — if the cabinet engine produced a `suggestedCabinet`,
  surface it as an actionable recommendation.

Each recommendation carries:

- `reason` — the specific project fact that triggered it.
- `engineeringExplanation` — the general engineering principle behind it.
- `suggestedAction` — the concrete change the user should make.
- `confidence` (0–1) and `priority` (`critical | high | medium | low`).

## Scoring impact

Deductions per finding by severity (see [`FORMULA-LIBRARY.md § 9`](./FORMULA-LIBRARY.md)):

| Severity   | Points off the affected category |
|------------|----------------------------------|
| info       | −4                               |
| warning    | −12                              |
| critical   | −25                              |

Category mapping (rule.category → score bucket):

| Rule category      | Score bucket             |
|--------------------|--------------------------|
| display / content  | `displayDesign`          |
| viewing            | `viewingExperience`      |
| installation       | `installationEfficiency` |
| power              | `powerEfficiency`        |
| maintainability    | `maintainability`        |

## Adding a rule

1. Append the rule to `rules/default-rules.ts`.
2. Provide a stable `id` (SCREAMING_SNAKE) — the id is a public code the UI can
   reference.
3. Write the `when` in terms of `ProjectData` + previously-computed context
   (`EngineeringResult` fields). **Never** couple to React or Supabase.
4. Add a test to `tests/rules-recommendations.test.ts` that triggers the rule.
5. Bump `ENGINE_VERSION`.
