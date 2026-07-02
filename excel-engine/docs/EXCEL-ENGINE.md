# Excel Engine — v0.5.0

> Renders an **editable** professional workbook containing the entire
> engineering + commercial + BOQ dataset.

## Sheets

| # | Sheet             | Purpose                                                                 |
|---|-------------------|-------------------------------------------------------------------------|
| 1 | Project Summary   | Company, project meta, customer meta.                                   |
| 2 | Engineering       | Every numeric metric from the Engineering Engine.                       |
| 3 | Commercial        | Cost totals, margin, tax, breakdown table (formatted currency).         |
| 4 | BOQ               | 12-section BOQ with subtotals and grand totals.                         |
| 5 | Calculations      | Every commercial line item with **live Excel formulas** (`qty*unit`).   |

## Formatting

- Header rows: solid slate background, white text, bold.
- Currency columns use the ISO code-aware pattern
  `"INR "#,##0.00;-"INR "#,##0.00` (falls back to the chosen currency).
- Frozen top row on the BOQ and Calculations sheets.
- Merged section header cells on the BOQ sheet for visual grouping.

## Editability

- Calculations sheet exposes formulas so end users can adjust unit prices in
  Excel/Google Sheets and see totals refresh.
- BOQ sheet uses static values (the source of truth is `projects.requirements.commercial`).
- Future: bi-directional import to persist Excel-side edits back to the
  Commercial Engine (Release 0.7 candidate).

## Public API

```ts
import { renderWorkbookBlob, EXCEL_ENGINE_VERSION } from '@/excel-engine'

const blob = await renderWorkbookBlob({ engineering, commercial, boq, proposal })
```

## Known limitations

- Charts (waterfall, pie) are not embedded — the current sheets use tables
  and formulas which round-trip cleanly across Excel/Sheets/Numbers.
- Logo images are not embedded; the header text carries branding.
- Excel row height is default (no auto-fit for wrapped descriptions).
