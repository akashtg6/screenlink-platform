# PDF Engine — v0.5.0

> Renders a `ProposalDocument` (from the Proposal Engine) into a
> production-quality PDF using **@react-pdf/renderer**. Renderer-only — no
> business logic. The engine consumes plain data and returns a `Blob`.

## Guarantees

- **A4 layout** with professional typography (Inter web-font when reachable;
  Helvetica fallback for offline / print pipelines).
- **Deterministic** — same document → identical bytes (subject to fonts).
- **Header + footer on every content page** — branded top strip and
  "Page X of Y" bottom right.
- **Automatic page breaks** — tables, key-value blocks and callouts opt in to
  `wrap={false}` when needed to avoid ugly splits.
- **Cover page** is rendered separately (no header) to preserve the visual
  impact.
- **White-label** — all colours and company name come from
  `doc.branding` (config, not code).

## Public API

```ts
import { renderProposalPdfBlob, ProposalPdfDocument, PDF_ENGINE_VERSION } from '@/pdf-engine'

const blob = await renderProposalPdfBlob(proposalDocument)
// Or use ProposalPdfDocument directly with @react-pdf/renderer's <PDFViewer />
```

## Extending

1. Add a new template family (e.g. "technical", "executive") by cloning
   `proposal-pdf.tsx` and swapping the section layout — keep the
   `ProposalDocument` input unchanged so all consumers can switch templates
   without changing business logic.
2. Add a new row kind to `ProposalRow` in the Proposal Engine, then handle it
   in the `Row` switch. The Excel and HTML renderers must be updated in
   parallel to keep parity.
3. Multi-language: swap the fonts registered on module load and pass locale-
   aware content through the proposal-engine builders.

## Known limitations

- Vector logos are not yet supported — add via `<Image src="…" />` when
  `branding.logoUrl` is present (planned Release 0.6).
- Chart rendering (pie charts of the commercial breakdown) is not embedded in
  the PDF; the numeric summary table conveys the same information.
- Web-font registration requires network access at first render. In airgapped
  environments the engine falls back to Helvetica silently.
