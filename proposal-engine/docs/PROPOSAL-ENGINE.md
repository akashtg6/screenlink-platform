# Proposal Engine — v0.5.0

> Assembles a full, structured **ProposalDocument** from the pre-computed
> Engineering, Commercial and BOQ engine outputs. The Proposal Engine
> **never renders**. Rendering (PDF, HTML, Word, Email, API) is the
> responsibility of separate exporters that consume the ProposalDocument.

## Why a separate engine?

A proposal is an *ordered assembly* of business narrative and engine outputs.
Centralising this composition means:

- One set of tests locks the section list and content shape.
- Adding a new output format (PDF → DOCX → API JSON) never requires touching
  business logic.
- Consumers of the proposal (Sales, AI Assistant, external CRMs) can read the
  same JSON.

## Architectural rules

- Pure TypeScript, no React, no I/O.
- Consumes only `EngineeringResult`, `CommercialResult`, `BOQDocument`,
  branding, customer, project meta and terms — no other coupling.
- Emits pure data. Row shapes are limited to `heading | paragraph | key_value | table | bullets | callout` — renderers map these to their native primitives.
- Branding is **fully config-driven** (`ProposalBranding`). No hardcoded
  company name, colour, or logo. White-label ready.

## Sections (fixed order, ids stable)

| # | id                        | Title                        |
|---|---------------------------|------------------------------|
| 1 | `cover`                   | Cover page                   |
| 2 | `customer_project`        | Customer & Project           |
| 3 | `project_summary`         | Project summary              |
| 4 | `engineering_summary`     | Engineering summary          |
| 5 | `commercial_summary`      | Commercial summary           |
| 6 | `boq`                     | Bill of Quantities           |
| 7 | `technical_specifications`| Technical specifications     |
| 8 | `recommendations`         | Engineering recommendations  |
| 9 | `warnings`                | Warnings & notes             |
|10 | `terms`                   | Terms & conditions           |
|11 | `warranty`                | Warranty & AMC               |
|12 | `company_details`         | Company details (branding)   |

## Public API

```ts
import {
  generateProposal, PROPOSAL_ENGINE_VERSION,
  mergeBranding, SCREENLINK_DEFAULT_BRANDING,
  type ProposalDocument, type ProposalInputs,
  type ProposalBranding, type ProposalCustomer,
  type ProposalProjectMeta, type ProposalTerms,
} from '@/proposal-engine'

const doc: ProposalDocument = generateProposal({
  branding: mergeBranding({ /* white-label overrides */ }),
  customer: { name: 'ACME', organization: 'ACME Corp' },
  project: { projectName: 'Lobby wall', proposalNumber: 'SL-0001', revision: 'R0' },
  engineering, commercial, boq,
  terms: { paymentTerms: '40 / 50 / 10', deliveryLeadTime: '6–8 weeks' },
})
```

## Renderer contract

Every `ProposalSection.rows[]` is a union of six atomic row kinds. Renderers
(PDF, HTML, Excel, Word, Email) simply pattern-match on `row.kind`:

```ts
switch (row.kind) {
  case 'heading':   return <H1|H2|H3>{row.text}</…>
  case 'paragraph': return <p>{row.text}</p>
  case 'key_value': return <dl>…</dl>
  case 'table':     return <Table columns={row.columns} rows={row.rows} summary={row.summary} />
  case 'bullets':   return <ul>{row.items.map…}</ul>
  case 'callout':   return <Callout tone={row.tone} title={row.title}>{row.text}</Callout>
}
```

## Deterministic output

- Same inputs → same document (verified by snapshot).
- `meta.generatedAt` is the only intentionally variable field.

## Extending

Add a section:

1. Extend `ProposalSection['kind']` union in `models/proposal-document.ts`.
2. Add a builder in `sections/section-builders.ts`.
3. Wire it into `core/generate-proposal.ts` (order-sensitive).
4. Update tests + docs.
