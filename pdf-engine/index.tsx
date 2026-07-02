// Public API of the PDF Engine.
//
// Renderer-only: consumes a ProposalDocument produced by the Proposal Engine
// and turns it into a PDF Blob. Never talks to Supabase or any React page.
export { PDF_ENGINE_VERSION, ProposalPdfDocument, renderProposalPdfBlob } from './proposal-pdf'
