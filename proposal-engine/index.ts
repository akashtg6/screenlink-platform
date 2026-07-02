// Extend the public API to expose report presets.
export { generateProposal, PROPOSAL_ENGINE_VERSION } from './core/generate-proposal'
export { SCREENLINK_DEFAULT_BRANDING, mergeBranding } from './branding'
export { generateReport, REPORT_KINDS, type ReportKind } from './reports/report-presets'
export type {
  ProposalDocument,
  ProposalSection,
  ProposalRow,
  ProposalInputs,
  ProposalBranding,
  ProposalCustomer,
  ProposalProjectMeta,
  ProposalTerms,
} from './models/proposal-document'
