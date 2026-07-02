/**
 * ScreenLink.ai — default branding used until per-organisation branding is
 * introduced. Consumers can override any field via a shallow merge.
 */
import type { ProposalBranding } from './models/proposal-document'

export const SCREENLINK_DEFAULT_BRANDING: ProposalBranding = Object.freeze({
  companyName: 'ScreenLink.ai',
  tagline: 'Professional Display Engineering — designed, engineered, quoted.',
  primaryColor: '#0F172A',
  accentColor: '#0EA5E9',
  footerText: 'Generated with ScreenLink.ai — the professional display engineering platform.',
  contact: {
    email: 'hello@screenlink.ai',
    website: 'https://screenlink.ai',
  },
  legal: {
    registeredName: 'ScreenLink Technologies',
  },
})

export function mergeBranding(overrides?: Partial<ProposalBranding>): ProposalBranding {
  if (!overrides) return SCREENLINK_DEFAULT_BRANDING
  return {
    ...SCREENLINK_DEFAULT_BRANDING,
    ...overrides,
    contact: { ...SCREENLINK_DEFAULT_BRANDING.contact, ...(overrides.contact ?? {}) },
    legal:   { ...SCREENLINK_DEFAULT_BRANDING.legal,   ...(overrides.legal ?? {}) },
  }
}
