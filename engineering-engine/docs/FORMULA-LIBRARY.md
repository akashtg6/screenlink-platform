# Formula Library — ScreenLink.ai Engineering Engine (v4B.0.0)

Every number the platform surfaces originates from one of the formulas below.
All formulas are pure functions in `engineering-engine/calculators/*`.

---

## 1. Screen Geometry (`calculators/screen-geometry.ts`)

### 1.1 Unit normalisation → millimetres
```
widthMm = toMm(width, unit)
heightMm = toMm(height, unit)
```
**Rationale:** every downstream engine reasons in mm so unit mismatches are
eliminated at the boundary.

### 1.2 Diagonal
```
diagonalMm  = √(widthMm² + heightMm²)
diagonalInch = diagonalMm / 25.4
```
**Rationale:** displays are historically specified by diagonal inches. The
physical diagonal is the Pythagorean hypotenuse of the panel rectangle.

### 1.3 Area & perimeter
```
areaSqM       = (widthMm · heightMm) / 1_000_000
perimeterMm   = 2 · (widthMm + heightMm)
```
Area drives power, weight and BOQ line items.

### 1.4 Orientation
```
orientation =
    heightMm > widthMm ? 'portrait'
  : widthMm  > heightMm ? 'landscape'
  : 'square'
```

---

## 2. Aspect Ratio (`calculators/aspect-ratio.ts`)

```
actualRatio = widthMm / heightMm
```
Compared against the frozen table `STANDARD_ASPECT_RATIOS` (16:9, 21:9, 32:9,
4:3, 5:4, 1:1, 9:16, 2:1, 2.35:1 …). The nearest match by absolute ratio
difference is returned. When the difference exceeds `tolerance` (default 5%),
`isStandard = false` and the wizard shows a non-standard note.

GCD reduction produces the human-readable form:
```
g = gcd(w, h)   →   reducedName = `${w/g}:${h/g}`
```

---

## 3. Resolution (`calculators/resolution.ts`)

### 3.1 Pixel count (integer floor)
```
horizontalPixels = floor(widthMm  / pixelPitchMm)
verticalPixels   = floor(heightMm / pixelPitchMm)
totalPixels      = horizontalPixels · verticalPixels
megapixels       = round(totalPixels / 1_000_000, 2)
```
Floor is intentional: an LED cabinet only supports whole pixels; anything
smaller falls into unused edge space (see cabinet engine).

### 3.2 Classification
Compared against `RESOLUTION_CLASSES` (HD, FHD, 2K, QHD, UHD-4K, DCI-4K, 5K,
8K …) with a 10% tolerance per axis. Anything outside is `Custom`.

---

## 4. Pixel Density (`calculators/pixel-density.ts`)

```
pixelsPerMeter        = 1000 / pixelPitchMm
pixelDensityPPI       = 25.4 / pixelPitchMm
pixelsPerSquareMeter  = pixelsPerMeter²
totalLEDs             = horizontalPixels · verticalPixels
```
PPI is derived from the inch definition (25.4 mm). Total LEDs assumes one RGB
module per pixel — the engine treats this as one BOQ line item per pixel.

---

## 5. Cabinet Engine (`calculators/cabinet.ts`)

```
h = floor(screenWidthMm  / cabinetWidthMm)
v = floor(screenHeightMm / cabinetHeightMm)
totalCabinets = h · v
usedWidthMm   = h · cabinetWidthMm
usedHeightMm  = v · cabinetHeightMm
unusedAreaSqM = (screenAreaMm² − usedAreaMm²) / 1_000_000
efficiencyPercent = 100 · usedArea / screenArea
isEfficient   = efficiencyPercent ≥ 95
```
**Rationale:** cabinets are indivisible. Screens whose dimensions are not
integer multiples of the cabinet size leave un-lit strips at the edges. 95% is
the industry threshold for a “clean” tile pattern; below that, the engine
suggests a nearest divisor cabinet size that tiles exactly (`suggestedCabinet`).

---

## 6. Power Engine (`calculators/power.ts`)

Defaults live in `constants/engineering-defaults.ts → POWER_DEFAULTS`.

```
wattsPerSqMMax     = POWER_DEFAULTS.maxWattsPerSqM[displayFamily]     (default: led=800, lcd=200)
typicalFactor      = POWER_DEFAULTS.typicalFactor[contentType]        (default: 0.40)
wattsPerSqMTypical = wattsPerSqMMax · typicalFactor
maxWatts           = wattsPerSqMMax     · screenAreaSqM
typicalWatts       = wattsPerSqMTypical · screenAreaSqM
hours              = clamp(operationHoursPerDay, 0, 24)  (default 10)
dailyKWh           = (typicalWatts · hours) / 1000
monthlyKWh         = dailyKWh · 30
annualKWh          = dailyKWh · 365
```
Per-cabinet power (max, typical) is emitted only when `totalCabinets` is known.

**Content-type factors** (fraction of max):

| Content       | Factor |
|---------------|--------|
| powerpoint    | 0.30   |
| dashboard     | 0.35   |
| control_room  | 0.40   |
| mixed         | 0.45   |
| video         | 0.50   |
| broadcast     | 0.55   |
| advertising   | 0.55   |
| gaming        | 0.60   |

---

## 7. Weight Engine (`calculators/weight.ts`)

```
massPerSqM             = WEIGHT_DEFAULTS.massPerSqM[displayFamily]
                         (led=30, lcd=20, transparent=12, projection=5)
totalDisplayWeightKg   = massPerSqM · screenAreaSqM
weightPerCabinetKg     = totalDisplayWeightKg / totalCabinets   (if provided)
```
Structural quantities (kN, CoG, wall-load) are reserved for Sprint 5.

---

## 8. Viewing Engine (`calculators/viewing.ts`)

Classic pixel-pitch viewing distance rule:

```
minDistanceM         = pixelPitchMm · 1     (metres — “Rule of 1”)
recommendedDistanceM = pixelPitchMm · 3     (metres — “Rule of 3”)
maxDistanceM         = pixelPitchMm · 30    (metres — “Rule of 30”)
```

**Fitness** (given `actualDistanceM`):

| Condition                                | Fitness       |
|------------------------------------------|---------------|
| actual < min                             | `too_close`   |
| actual > max                             | `too_far`     |
| \|actual − recommended\| ≤ 20% of rec      | `ideal`       |
| within [min, max] but not `ideal`        | `ok`          |
| actual undefined                         | `unspecified` |

**Comfort score** (0–100):

```
ideal    → 100
too_close → round(60 · actual / min)
too_far   → round(100 − 40 · (actual/max − 1))
ok        → max(60, round(100 − 40 · |actual − rec|/rec))
```

---

## 9. Engineering Score (`scoring/engineering-score.ts`)

Each category starts at 100. Deductions per rule finding:

| Severity   | Deduction |
|------------|-----------|
| info       | −4        |
| warning    | −12       |
| critical   | −25       |

Extra penalties:
- Cabinet efficiency < 90% → `round((95 − eff) · 0.6)` off `installation`.
- Viewing comfort < 100    → `round((100 − comfort) · 0.6)` cap on `viewing`.

Overall (weighted):

```
overall = round(
    displayDesign          · 0.30
  + viewingExperience     · 0.25
  + installationEfficiency · 0.20
  + powerEfficiency       · 0.15
  + maintainability       · 0.10
)
```

Grade thresholds:

| Score    | Grade |
|----------|-------|
| 90–100   | A     |
| 80–89    | B     |
| 70–79    | C     |
| 60–69    | D     |
| < 60     | F     |

---

## 10. Unit conversion helpers (`utils/math.ts`)

```
toMm(value, 'mm')   = value
toMm(value, 'cm')   = value · 10
toMm(value, 'm')    = value · 1000
toMm(value, 'inch') = value · 25.4
toMm(value, 'ft')   = value · 304.8

mmToInch(mm) = mm / 25.4
mmToM(mm)    = mm / 1000

round(x, n)  = Math.round(x · 10ⁿ) / 10ⁿ
clamp(x,a,b) = min(b, max(a, x))
gcd(a, b)    = classical Euclidean
```

---

## Determinism

Every formula is deterministic — for the same `ProjectData`, the engine will
return exactly the same numeric fields on every call (verified by the
*is deterministic* Vitest cases). The only non-deterministic fields on the
result are `calculationTimeMs` (per-call profiling) and `generatedAt` (ISO
timestamp).
