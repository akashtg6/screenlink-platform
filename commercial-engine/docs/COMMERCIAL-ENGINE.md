# Commercial Engine — v0.5.0

> **Purpose:** A framework-agnostic, pure-TypeScript engine that turns unit
> costs, margin, discount and tax into a fully-priced Commercial Result. It is
> the *only* source of truth for commercial numbers in ScreenLink.ai — UI
> code must never calculate.

## Architectural rules (non-negotiable)

1. Pure TypeScript — no React, no Supabase, no DOM APIs.
2. Stateless — same `CommercialInput` → identical `CommercialResult`.
3. Independent of the Engineering Engine's *implementation*. Reads only
   the typed `EngineeringResult` DTO (area, cabinets) to derive quantities.
4. Does not modify engineering values — commercial logic can never write back.
5. Renderer-agnostic — outputs plain data; PDF/Excel/HTML/Email consume it.

## Folder structure

```
commercial-engine/
├── core/
│   └── calculate-commercial.ts       # single public entry point
├── calculators/
│   ├── line-items.ts                 # materialise LineItem[] from input + eng
│   ├── aggregate.ts                  # per-category totals + taxable base
│   └── margin-tax.ts                 # margin, discount, tax, profit maths
├── constants/
│   ├── currencies.ts                 # ISO-4217 registry + Intl formatter
│   └── commercial-defaults.ts        # margin=25, GST=18… all overridable
├── models/
│   ├── commercial-input.ts           # CommercialInput + LineItem + TaxConfig
│   └── commercial-result.ts          # CommercialResult
├── tests/
│   └── commercial-engine.test.ts     # 15 vitest cases
└── index.ts                          # PUBLIC API
```

## Public API

```ts
import {
  calculateCommercial,
  COMMERCIAL_ENGINE_VERSION,
  formatCurrency,
  CURRENCIES, DEFAULT_CURRENCY,
  COMMERCIAL_DEFAULTS,

  type CommercialInput,
  type CommercialResult,
  type LineItem, type LineItemCategory,
  type TaxConfig,
  type CurrencyCode, type CurrencyMeta,
  type CostBreakdownEntry,
} from '@/commercial-engine'
```

## Formulas

Given the aggregated `totalCost` and taxable base, the engine applies:

```
priceBeforeDiscount = totalCost / (1 – margin/100)             # margin-based pricing
discountAmount      = priceBeforeDiscount · discount/100
priceBeforeTax      = priceBeforeDiscount – discountAmount
discountRatio       = priceBeforeTax / priceBeforeDiscount
taxableBase′        = taxableBase · discountRatio               # discount fairly reduces tax base
taxAmount           = taxableBase′ · taxRate/100
sellingPrice        = priceBeforeTax + taxAmount
profit              = priceBeforeTax – totalCost                # margin realised after discount
```

## Line-item classification

| id prefix         | Category         |
|-------------------|------------------|
| `mat-*`           | material         |
| `infra-*`         | infrastructure   |
| `svc-install-*`   | installation     |
| `svc-*` (rest)    | services         |
| `warranty-*`      | post_sale        |
| `amc-*`           | post_sale        |
| user extras       | material / services (per API) |

## Currencies

ISO-4217 codes are the interchange format. Six are supported today:
**INR** (default), **USD**, **EUR**, **GBP**, **AED**, **SAR**. Adding a
currency = one entry in `constants/currencies.ts` (no downstream changes).

## Tax model

Single-rate for MVP. The `TaxConfig` shape reserves `components: [{label, ratePercent}]`
for future compound taxes (CGST + SGST, VAT + surcharge, …) without a schema
break. Line-item level overrides are pre-declared via `LineItem.taxRateOverride`.

## Determinism & performance

- Same input → identical numeric output (verified in tests).
- 500 iterations run under ~50–100 ms in CI.

## Persistence

Store the raw `CommercialInput` under `projects.requirements.commercial`.
The engine is stateless — recompute the `CommercialResult` on load.
