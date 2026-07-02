import type { ProposalInputs, ProposalSection, ProposalRow } from '../models/proposal-document'
import { fmt, num, pct, shortDate } from '../utils/format'

/**
 * All section builders live in this module. They read the typed inputs and
 * produce fully-serialisable `ProposalSection` rows.
 *
 * IMPORTANT: builders never touch React, never format for a specific renderer.
 * The output is renderer-agnostic — the PDF, HTML, Word and Email exporters
 * consume the SAME data.
 */

export function coverSection(inp: ProposalInputs): ProposalSection {
  const { branding, customer, project } = inp
  return {
    id: 'cover', title: 'Proposal', order: 1, kind: 'cover',
    rows: [
      { kind: 'heading', text: branding.companyName, level: 1 },
      ...(branding.tagline ? [{ kind: 'paragraph', text: branding.tagline } as ProposalRow] : []),
      { kind: 'heading', text: project.projectName, level: 2 },
      { kind: 'key_value', items: [
        { label: 'Prepared for',      value: customer.organization || customer.name },
        { label: 'Contact',           value: customer.contactPerson || '—' },
        { label: 'Proposal number',   value: project.proposalNumber || '—' },
        { label: 'Proposal date',     value: shortDate(project.proposalDate) },
        { label: 'Revision',          value: project.revision || 'R0' },
        { label: 'Valid until',       value: shortDate(project.validUntil) },
        { label: 'Prepared by',       value: project.preparedBy || '—' },
      ] },
    ],
  }
}

export function customerProjectSection(inp: ProposalInputs): ProposalSection {
  const { customer, project } = inp
  return {
    id: 'customer_project', title: 'Customer & Project', order: 2, kind: 'customer_project',
    rows: [
      { kind: 'heading', text: 'Customer', level: 2 },
      { kind: 'key_value', items: [
        { label: 'Customer',      value: customer.name },
        { label: 'Organisation',  value: customer.organization || '—' },
        { label: 'Contact',       value: customer.contactPerson || '—' },
        { label: 'Email',         value: customer.email || '—' },
        { label: 'Phone',         value: customer.phone || '—' },
        { label: 'Address',       value: customer.address || '—' },
      ] },
      { kind: 'heading', text: 'Project', level: 2 },
      { kind: 'key_value', items: [
        { label: 'Project name',           value: project.projectName },
        { label: 'Project code',           value: project.projectCode || '—' },
        { label: 'Application',            value: project.application || '—' },
        { label: 'Site address',           value: project.siteAddress || '—' },
        { label: 'Target completion date', value: shortDate(project.targetCompletionDate) },
      ] },
    ],
  }
}

export function projectSummarySection(inp: ProposalInputs): ProposalSection {
  const { engineering: e } = inp
  return {
    id: 'project_summary', title: 'Project Summary', order: 3, kind: 'project_summary',
    rows: [
      { kind: 'paragraph', text: 'A concise, executive-level overview of the display solution proposed for this project.' },
      { kind: 'key_value', items: [
        { label: 'Screen size',      value: `${num(e.geometry?.diagonalInch ?? 0, 0)}"  (${num(e.geometry?.areaSqM ?? 0)} m²)` },
        { label: 'Aspect ratio',     value: e.aspectRatio?.humanReadable || '—' },
        { label: 'Resolution',       value: e.resolution ? `${e.resolution.horizontalPixels} × ${e.resolution.verticalPixels} (${e.resolution.shortName})` : '—' },
        { label: 'Pixel density',    value: e.pixelDensity ? `${num(e.pixelDensity.pixelDensityPPI)} PPI` : '—' },
        { label: 'Cabinets',         value: e.cabinet ? `${e.cabinet.horizontalCount} × ${e.cabinet.verticalCount}  (${e.cabinet.totalCabinets} total)` : '—' },
        { label: 'Viewing distance', value: e.viewing?.recommendedDistanceM ? `${num(e.viewing.recommendedDistanceM)} m recommended` : '—' },
      ] },
    ],
  }
}

export function engineeringSummarySection(inp: ProposalInputs): ProposalSection {
  const { engineering: e } = inp
  const rows: ProposalRow[] = [
    { kind: 'heading', text: 'Engineering summary', level: 2 },
    { kind: 'key_value', items: [
      { label: 'Engineering score', value: e.score ? `${e.score.overall}/100 (${e.score.grade})` : '—' },
      { label: 'Display design',    value: e.score ? String(e.score.categories.displayDesign) : '—' },
      { label: 'Viewing experience',value: e.score ? String(e.score.categories.viewingExperience) : '—' },
      { label: 'Installation',      value: e.score ? String(e.score.categories.installationEfficiency) : '—' },
      { label: 'Power efficiency',  value: e.score ? String(e.score.categories.powerEfficiency) : '—' },
      { label: 'Maintainability',   value: e.score ? String(e.score.categories.maintainability) : '—' },
    ] },
  ]
  if (e.power) rows.push({ kind: 'key_value', items: [
    { label: 'Max power',     value: `${num(e.power.maxWatts / 1000)} kW` },
    { label: 'Typical power', value: `${num(e.power.typicalWatts / 1000)} kW` },
    { label: 'Annual energy', value: `${num(e.power.annualKWh, 0)} kWh` },
  ] })
  if (e.weight) rows.push({ kind: 'key_value', items: [
    { label: 'Total weight',      value: `${num(e.weight.totalDisplayWeightKg)} kg` },
    { label: 'Weight per m²',     value: `${num(e.weight.weightPerSqMKg)} kg/m²` },
  ] })
  return { id: 'engineering_summary', title: 'Engineering Summary', order: 4, kind: 'engineering_summary', rows }
}

export function commercialSummarySection(inp: ProposalInputs): ProposalSection {
  const { commercial: c } = inp
  const rows: ProposalRow[] = [
    { kind: 'heading', text: 'Commercial summary', level: 2 },
    { kind: 'table',
      columns: ['Category', 'Amount', 'Share'],
      rows: c.breakdown.map(b => [b.category, fmt(b.amount, c.currency), pct(b.percentOfTotal)]),
      summary: [
        { label: 'Total cost',        value: fmt(c.totalCost, c.currency) },
        { label: 'Margin',            value: pct(c.marginPercent) },
        { label: 'Discount',          value: pct(c.discountPercent) },
        { label: 'Price before tax',  value: fmt(c.priceBeforeTax, c.currency) },
        { label: `${c.tax.label} (${pct(c.tax.ratePercent)})`, value: fmt(c.taxAmount, c.currency) },
        { label: 'Selling price',     value: fmt(c.sellingPrice, c.currency) },
        { label: 'Profit',            value: fmt(c.profit, c.currency) },
      ],
    },
  ]
  return { id: 'commercial_summary', title: 'Commercial Summary', order: 5, kind: 'commercial_summary', rows }
}

export function boqSection(inp: ProposalInputs): ProposalSection {
  const { boq } = inp
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Bill of Quantities', level: 2 }]
  for (const sec of boq.sections) {
    if (sec.items.length === 0) continue
    rows.push({ kind: 'heading', text: sec.title, level: 3 })
    if (sec.description) rows.push({ kind: 'paragraph', text: sec.description })
    rows.push({ kind: 'table',
      columns: ['#', 'Description', 'Qty', 'Unit', 'Unit price', 'Amount'],
      rows: sec.items.map((it, i) => [
        String(i + 1), it.description, num(it.quantity), it.unit,
        fmt(it.unitPrice, boq.currency), fmt(it.amount, boq.currency),
      ]),
      summary: [{ label: `${sec.title} subtotal`, value: fmt(sec.subtotal, boq.currency) }],
    })
  }
  rows.push({ kind: 'key_value', items: [
    { label: 'Grand subtotal',    value: fmt(boq.grandSubtotal, boq.currency) },
    { label: 'Discount',          value: fmt(boq.discountAmount, boq.currency) },
    { label: 'Price before tax',  value: fmt(boq.priceBeforeTax, boq.currency) },
    { label: `${boq.taxLabel} (${pct(boq.taxRatePercent)})`, value: fmt(boq.taxAmount, boq.currency) },
    { label: 'Grand total',       value: fmt(boq.grandTotal, boq.currency) },
  ] })
  return { id: 'boq', title: 'Bill of Quantities', order: 6, kind: 'boq', rows }
}

export function technicalSpecificationsSection(inp: ProposalInputs): ProposalSection {
  const { engineering: e } = inp
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Technical specifications', level: 2 }]
  const kv: Array<{ label: string; value: string }> = []
  if (e.geometry)     kv.push({ label: 'Physical size',        value: `${num(e.geometry.widthMm, 0)} × ${num(e.geometry.heightMm, 0)} mm` })
  if (e.resolution)   kv.push({ label: 'Resolution',           value: `${e.resolution.horizontalPixels} × ${e.resolution.verticalPixels}` })
  if (e.pixelDensity) kv.push({ label: 'Pixel pitch',          value: `${num(1000 / (e.pixelDensity.pixelsPerMeter || 1), 2)} mm` })
  if (e.pixelDensity) kv.push({ label: 'Pixel density',        value: `${num(e.pixelDensity.pixelDensityPPI)} PPI` })
  if (e.cabinet)      kv.push({ label: 'Cabinet grid',         value: `${e.cabinet.horizontalCount} × ${e.cabinet.verticalCount}` })
  if (e.cabinet)      kv.push({ label: 'Cabinet efficiency',   value: pct(e.cabinet.efficiencyPercent) })
  if (e.power)        kv.push({ label: 'Power (max)',          value: `${num(e.power.maxWatts / 1000)} kW` })
  if (e.power)        kv.push({ label: 'Power density',        value: `${num(e.power.wattsPerSqMMax)} W/m²` })
  if (e.weight)       kv.push({ label: 'Weight',               value: `${num(e.weight.totalDisplayWeightKg)} kg` })
  if (e.viewing)      kv.push({ label: 'Viewing (min/rec/max)',value: `${num(e.viewing.minDistanceM)} / ${num(e.viewing.recommendedDistanceM)} / ${num(e.viewing.maxDistanceM)} m` })
  rows.push({ kind: 'key_value', items: kv })
  return { id: 'technical_specifications', title: 'Technical Specifications', order: 7, kind: 'technical_specifications', rows }
}

export function recommendationsSection(inp: ProposalInputs): ProposalSection {
  const recs = inp.engineering.recommendations ?? []
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Engineering recommendations', level: 2 }]
  if (recs.length === 0) {
    rows.push({ kind: 'callout', tone: 'success', title: 'All good', text: 'No engineering recommendations — the design is on-target.' })
  } else {
    for (const r of recs) {
      rows.push({ kind: 'heading', text: `${r.priority.toUpperCase()} · ${r.title}`, level: 3 })
      rows.push({ kind: 'paragraph', text: `Why: ${r.reason}` })
      rows.push({ kind: 'paragraph', text: `Engineering rationale: ${r.engineeringExplanation}` })
      if (r.suggestedAction) rows.push({ kind: 'paragraph', text: `Suggested action: ${r.suggestedAction}` })
    }
  }
  return { id: 'recommendations', title: 'Recommendations', order: 8, kind: 'recommendations', rows }
}

export function warningsSection(inp: ProposalInputs): ProposalSection {
  const { engineering: e, commercial: c } = inp
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Warnings & notes', level: 2 }]
  const allWarnings: Array<{ tone: 'critical' | 'warning' | 'info'; text: string }> = [
    ...e.errors.map(w => ({ tone: 'critical' as const, text: `${w.code}: ${w.message}` })),
    ...e.warnings.map(w => ({ tone: 'warning' as const, text: `${w.code || w.severity}: ${w.message}` })),
    ...c.warnings.map(w => ({ tone: 'warning' as const, text: w })),
    ...e.notes.map(n => ({ tone: 'info' as const, text: n })),
  ]
  if (allWarnings.length === 0) {
    rows.push({ kind: 'callout', tone: 'success', text: 'No warnings.' })
  } else {
    for (const w of allWarnings) rows.push({ kind: 'callout', tone: w.tone, text: w.text })
  }
  return { id: 'warnings', title: 'Warnings & Notes', order: 9, kind: 'warnings', rows }
}

export function termsSection(inp: ProposalInputs): ProposalSection {
  const t = inp.terms ?? {}
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Terms & Conditions', level: 2 }]
  const kv: Array<{ label: string; value: string }> = []
  if (t.paymentTerms)      kv.push({ label: 'Payment terms',     value: t.paymentTerms })
  if (t.deliveryLeadTime)  kv.push({ label: 'Delivery lead time',value: t.deliveryLeadTime })
  if (t.cancellationPolicy)kv.push({ label: 'Cancellation',      value: t.cancellationPolicy })
  if (t.forceMajeure)      kv.push({ label: 'Force majeure',     value: t.forceMajeure })
  if (kv.length) rows.push({ kind: 'key_value', items: kv })
  for (const c of t.custom ?? []) {
    rows.push({ kind: 'heading', text: c.title, level: 3 })
    rows.push({ kind: 'paragraph', text: c.body })
  }
  if (rows.length === 1) rows.push({ kind: 'paragraph', text: 'Standard commercial terms apply. Refer to the master service agreement for the complete terms of engagement.' })
  return { id: 'terms', title: 'Terms & Conditions', order: 10, kind: 'terms', rows }
}

export function warrantySection(inp: ProposalInputs): ProposalSection {
  const rows: ProposalRow[] = [{ kind: 'heading', text: 'Warranty & AMC', level: 2 }]
  if (inp.terms?.warrantyTerms) rows.push({ kind: 'paragraph', text: inp.terms.warrantyTerms })
  else rows.push({ kind: 'paragraph', text: 'Manufacturer\u2019s standard warranty applies. Extended warranty and AMC options are itemised in the BOQ.' })
  if (inp.terms?.amcTerms) rows.push({ kind: 'paragraph', text: inp.terms.amcTerms })
  return { id: 'warranty', title: 'Warranty', order: 11, kind: 'warranty', rows }
}

export function companyDetailsSection(inp: ProposalInputs): ProposalSection {
  const { branding } = inp
  return {
    id: 'company_details', title: 'Company Details', order: 12, kind: 'company_details',
    rows: [
      { kind: 'heading', text: branding.companyName, level: 2 },
      { kind: 'key_value', items: [
        { label: 'Registered name',    value: branding.legal.registeredName || branding.companyName },
        { label: 'Registration number',value: branding.legal.registrationNumber || '—' },
        { label: 'Tax id',             value: branding.legal.taxId || '—' },
        { label: 'Email',              value: branding.contact.email || '—' },
        { label: 'Phone',              value: branding.contact.phone || '—' },
        { label: 'Website',            value: branding.contact.website || '—' },
        { label: 'Address',            value: branding.contact.address || '—' },
      ] },
      ...(branding.footerText ? [{ kind: 'paragraph' as const, text: branding.footerText } as ProposalRow] : []),
    ],
  }
}
