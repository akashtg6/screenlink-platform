import type { ProposalDocument, ProposalInputs, ProposalSection } from '../models/proposal-document'
import { generateProposal } from '../core/generate-proposal'

/**
 * Report presets — build purpose-specific documents on top of the full
 * ProposalDocument. Each preset selects a subset of sections; identical
 * rendering pipelines apply, so PDF/Excel output stays consistent.
 */
export type ReportKind =
  | 'full_proposal'
  | 'engineering_report'
  | 'commercial_report'
  | 'executive_summary'
  | 'customer_summary'

export const REPORT_KINDS: ReadonlyArray<{ id: ReportKind; title: string; description: string }> = [
  { id: 'full_proposal',       title: 'Full Proposal',        description: 'All 12 sections — the customer-facing document.' },
  { id: 'engineering_report',  title: 'Engineering Report',   description: 'Engineering summary, technical specs, recommendations, warnings.' },
  { id: 'commercial_report',   title: 'Commercial Report',    description: 'Commercial summary and Bill of Quantities.' },
  { id: 'executive_summary',   title: 'Executive Summary',    description: 'Cover, project summary, engineering summary and commercial summary only.' },
  { id: 'customer_summary',    title: 'Customer Summary',     description: 'Everything the buyer needs — excludes internal warnings.' },
]

export function generateReport(kind: ReportKind, inputs: ProposalInputs): ProposalDocument {
  const full = generateProposal(inputs)
  if (kind === 'full_proposal') return full
  const keep = SECTION_FILTERS[kind]
  const sections: ReadonlyArray<ProposalSection> = full.sections.filter((s) => keep.has(s.id))
  return { ...full, sections, title: `${full.title} — ${REPORT_KINDS.find(r => r.id === kind)!.title}` }
}

const SECTION_FILTERS: Record<Exclude<ReportKind, 'full_proposal'>, Set<string>> = {
  engineering_report: new Set(['cover', 'customer_project', 'engineering_summary', 'technical_specifications', 'recommendations', 'warnings', 'company_details']),
  commercial_report:  new Set(['cover', 'customer_project', 'commercial_summary', 'boq', 'terms', 'company_details']),
  executive_summary:  new Set(['cover', 'project_summary', 'engineering_summary', 'commercial_summary', 'company_details']),
  customer_summary:   new Set(['cover', 'customer_project', 'project_summary', 'engineering_summary', 'commercial_summary', 'boq', 'technical_specifications', 'recommendations', 'terms', 'warranty', 'company_details']),
}
