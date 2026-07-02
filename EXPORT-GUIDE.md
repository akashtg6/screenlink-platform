# ScreenLink.ai — Export Guide (Release 0.5)

This guide covers how to invoke the exporters, what each output contains and
how to add new ones.

## User flow — exporting from the workspace

1. Open a project: `/projects/<id>/workspace`.
2. Adjust engineering (via wizard) and commercial inputs (right column).
3. Open the **Export** panel (visible on the right column on desktop, inside
   the Commercial tab on mobile).
4. Choose:
   - **Proposal PDF** → downloads `<project>-proposal.pdf`.
   - **Excel workbook** → downloads `<project>-workbook.xlsx`.

Both exporters are **lazy-loaded** — the heavy dependencies
(`@react-pdf/renderer`, `exceljs`) are code-split so the first workspace paint
is fast.

## Under the hood — the export pipeline

```
  Engineering Engine ───┐
                      ├─▶  Proposal Engine  ─▶  Proposal Document (pure data)
  Commercial Engine ──┤                                    │
                      │                                    ├▶ PDF Engine ─▶ .pdf Blob
  BOQ Engine ─────────┘                                    └▶ Excel Engine ─▶ .xlsx Blob
```

- The **Proposal Engine never renders**. It emits a JSON-safe
  `ProposalDocument` composed of atomic row kinds (`heading`, `paragraph`,
  `key_value`, `table`, `bullets`, `callout`).
- The **PDF Engine** iterates the rows and maps each row kind to a React-PDF
  component. Cover pages get bespoke layout; other pages share a header and
  footer.
- The **Excel Engine** iterates the engineering/commercial/BOQ inputs (not
  the proposal rows) so it can expose native Excel formulas.

## Adding a new export format

Example: adding a Word (`.docx`) exporter.

1. Add a new folder `word-engine/` alongside `pdf-engine/` and `excel-engine/`.
2. Consume `ProposalDocument` from `@/proposal-engine`.
3. Map each `ProposalRow.kind` to the docx-library primitive.
4. Expose `renderProposalDocxBlob(doc): Promise<Blob>` from `word-engine/index.ts`.
5. Register it in `features/workspace/export-panel-connected.tsx` (or a new
   `ExportPanelConnected` variant).

Because every renderer speaks the same document contract, adding formats does
**not** touch business logic.

## Report presets

The Proposal Engine also exposes `generateReport(kind, inputs)` — 5 presets
select a subset of sections for use cases like Engineering Report or
Executive Summary. Any preset can be piped through the same PDF and Excel
engines.

| Kind                 | Sections                                              |
|----------------------|-------------------------------------------------------|
| `full_proposal`      | All 12 sections.                                      |
| `engineering_report` | Engineering + tech specs + recs + warnings.           |
| `commercial_report`  | Commercial + BOQ + terms.                             |
| `executive_summary`  | Cover + project + engineering + commercial + company. |
| `customer_summary`   | Full, minus internal warnings.                        |

## Determinism

All engines are deterministic given the same inputs. Only the following fields
differ between runs:

- `meta.generatedAt` (ISO timestamp)
- `calculationTimeMs` (per-call profiling)

Snapshot tests in `proposal-engine/tests/proposal-engine.test.ts` explicitly
zero those fields so CI stays stable.
