import type { BOQDocument } from '@/boq-engine'
import type { CommercialResult, CurrencyCode } from '@/commercial-engine'
import type { EngineeringResult } from '@/engineering-engine'

/**
 * White-label ready branding config. Everything the customer sees on the
 * proposal PDF/HTML/DOCX/Email comes from this object. Never hardcoded.
 */
export interface ProposalBranding {
  readonly companyName: string
  readonly tagline?: string
  readonly logoUrl?: string           // optional — rendered when present
  readonly primaryColor?: string      // hex (#0f172a) — used by PDF/HTML renderers
  readonly accentColor?: string       // hex (#0ea5e9)
  readonly footerText?: string
  readonly contact: {
    readonly email?: string
    readonly phone?: string
    readonly website?: string
    readonly address?: string
  }
  readonly legal: {
    readonly registeredName?: string
    readonly taxId?: string            // GSTIN, VAT number, EIN, …
    readonly registrationNumber?: string
    readonly termsUrl?: string
  }
}

export interface ProposalCustomer {
  readonly name: string
  readonly contactPerson?: string
  readonly email?: string
  readonly phone?: string
  readonly address?: string
  readonly organization?: string
}

export interface ProposalProjectMeta {
  readonly projectId?: string
  readonly projectCode?: string
  readonly projectName: string
  readonly application?: string
  readonly siteAddress?: string
  readonly targetCompletionDate?: string
  readonly preparedBy?: string
  readonly preparedByEmail?: string
  readonly proposalNumber?: string
  readonly proposalDate?: string      // ISO
  readonly validUntil?: string        // ISO — quote validity
  readonly revision?: string          // e.g. 'R0', 'R1'
}

export interface ProposalTerms {
  readonly paymentTerms?: string
  readonly deliveryLeadTime?: string
  readonly warrantyTerms?: string
  readonly amcTerms?: string
  readonly cancellationPolicy?: string
  readonly forceMajeure?: string
  readonly custom?: ReadonlyArray<{ title: string; body: string }>
}

export interface ProposalInputs {
  readonly branding: ProposalBranding
  readonly customer: ProposalCustomer
  readonly project: ProposalProjectMeta
  readonly engineering: EngineeringResult
  readonly commercial: CommercialResult
  readonly boq: BOQDocument
  readonly terms?: ProposalTerms
}

// ------------------------------------------------------------------
// Output document — pure data, framework/renderer agnostic.
// ------------------------------------------------------------------

export interface ProposalSection {
  readonly id: string
  readonly title: string
  readonly order: number
  readonly kind:
    | 'cover'
    | 'customer_project'
    | 'project_summary'
    | 'engineering_summary'
    | 'commercial_summary'
    | 'boq'
    | 'technical_specifications'
    | 'recommendations'
    | 'warnings'
    | 'terms'
    | 'warranty'
    | 'company_details'
  readonly rows: ReadonlyArray<ProposalRow>
}

export type ProposalRow =
  | { readonly kind: 'heading';   readonly text: string; readonly level?: 1 | 2 | 3 }
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'key_value'; readonly items: ReadonlyArray<{ label: string; value: string }> }
  | { readonly kind: 'table';     readonly columns: ReadonlyArray<string>; readonly rows: ReadonlyArray<ReadonlyArray<string>>; readonly summary?: ReadonlyArray<{ label: string; value: string }> }
  | { readonly kind: 'bullets';   readonly items: ReadonlyArray<string> }
  | { readonly kind: 'callout';   readonly tone: 'info' | 'warning' | 'critical' | 'success'; readonly title?: string; readonly text: string }

export interface ProposalDocument {
  readonly title: string
  readonly branding: ProposalBranding
  readonly customer: ProposalCustomer
  readonly project: ProposalProjectMeta
  readonly currency: CurrencyCode
  readonly sections: ReadonlyArray<ProposalSection>
  readonly totals: {
    readonly totalCost: number
    readonly priceBeforeTax: number
    readonly taxAmount: number
    readonly grandTotal: number
  }
  readonly meta: {
    readonly generatedAt: string
    readonly proposalEngineVersion: string
    readonly engineeringVersion?: string
    readonly commercialVersion: string
    readonly boqVersion: string
  }
}
