import type { ProposalDocument, ProposalInputs } from '../models/proposal-document'
import {
  coverSection, customerProjectSection, projectSummarySection,
  engineeringSummarySection, commercialSummarySection, boqSection,
  technicalSpecificationsSection, recommendationsSection, warningsSection,
  termsSection, warrantySection, companyDetailsSection,
} from '../sections/section-builders'

export const PROPOSAL_ENGINE_VERSION = '0.5.0'

/**
 * Compose a full ProposalDocument from the pre-computed engineering,
 * commercial and BOQ outputs. Rendering (PDF, Word, HTML, Email, API) is
 * intentionally outside this engine — the document is pure data.
 *
 * @param inputs — all typed contracts required to build the proposal.
 * @returns a serialisable ProposalDocument ready for any renderer.
 */
export function generateProposal(inputs: ProposalInputs): ProposalDocument {
  const sections = [
    coverSection(inputs),
    customerProjectSection(inputs),
    projectSummarySection(inputs),
    engineeringSummarySection(inputs),
    commercialSummarySection(inputs),
    boqSection(inputs),
    technicalSpecificationsSection(inputs),
    recommendationsSection(inputs),
    warningsSection(inputs),
    termsSection(inputs),
    warrantySection(inputs),
    companyDetailsSection(inputs),
  ]

  return {
    title: `${inputs.branding.companyName} — ${inputs.project.projectName}`,
    branding: inputs.branding,
    customer: inputs.customer,
    project: inputs.project,
    currency: inputs.commercial.currency,
    sections,
    totals: {
      totalCost: inputs.commercial.totalCost,
      priceBeforeTax: inputs.commercial.priceBeforeTax,
      taxAmount: inputs.commercial.taxAmount,
      grandTotal: inputs.commercial.sellingPrice,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      proposalEngineVersion: PROPOSAL_ENGINE_VERSION,
      engineeringVersion: inputs.engineering.engineVersion,
      commercialVersion: inputs.commercial.engineVersion,
      boqVersion: inputs.boq.meta.engineVersion,
    },
  }
}
