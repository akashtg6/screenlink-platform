# BOQ Engine — v0.5.0

> Generates a canonical, 12-section professional Bill of Quantities from the
> `CommercialResult` (and optionally the `EngineeringResult`).

## Architectural rules

- Pure TypeScript. No React, no I/O, no side effects.
- The BOQ Engine never re-prices anything: it consumes `LineItem.amount` from
  the Commercial Engine unchanged. Prices flow one-way (commercial → BOQ).
- Emits every section even if empty — downstream renderers rely on a stable
  schema.
- The output (`BOQDocument`) is plain data; PDF, Excel and UI consume the SAME
  document.

## 12 canonical sections

| # | id                | Title                      | Sourced from Commercial Engine line ids |
|---|-------------------|----------------------------|-----------------------------------------|
| 1 | `display`         | Display Modules            | `mat-led-*`                             |
| 2 | `cabinets`        | Cabinets                   | `mat-cabinet-*`                         |
| 3 | `controllers`     | Controllers                | `mat-controller-*`                      |
| 4 | `receiving_cards` | Receiving Cards            | `mat-receiver-*`                        |
| 5 | `power_supplies`  | Power Supplies             | `mat-psu-*`                             |
| 6 | `cables`          | Cables                     | `mat-cables-*`                          |
| 7 | `steel`           | Steel Structure            | `infra-steel-*`                         |
| 8 | `accessories`     | Accessories                | `mat-accessories-*`, unclassified matl. |
| 9 | `installation`    | Installation               | `svc-install-*`, `infra-transport-*`    |
|10 | `commissioning`   | Commissioning & Testing    | `svc-commission-*`                      |
|11 | `warranty`        | Warranty                   | `warranty-*`                            |
|12 | `amc`             | Annual Maintenance         | `amc-*`                                 |

## Public API

```ts
import {
  generateBOQ, BOQ_ENGINE_VERSION, BOQ_SECTION_META,
  type BOQDocument, type BOQSection, type BOQSectionId, type BOQItem, type BOQInputs,
} from '@/boq-engine'

const boq: BOQDocument = generateBOQ({
  engineering, commercial,
  // optional overrides for section descriptions
  headerNotes: { display: 'Fine-pitch LED modules per specification.' },
})
```

## Editability contract

Every `BOQItem` carries an `editable` flag (default `true`). Renderers may
respect it: user edits should be persisted back into `projects.requirements.commercial`
(as an `additionalMaterialLines`/`additionalServiceLines` override), not into
the BOQ engine — the engine remains stateless.

## Adding a section

1. Add the id to `BOQSectionId` in `models/boq-document.ts`.
2. Add its meta entry to `BOQ_SECTION_META` (`section-meta.ts`).
3. Extend `PREFIX_TO_SECTION` in `calculators/classify.ts` for the mapping.
4. Add a test that at least one classified line lands in the new section.

No other file changes are required — the engine iterates the meta table.
