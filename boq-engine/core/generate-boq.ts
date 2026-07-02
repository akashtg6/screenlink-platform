import type { BOQDocument, BOQInputs, BOQItem, BOQSection, BOQSectionId } from '../models/boq-document'
import { BOQ_SECTION_META } from '../section-meta'
import { classifyLine, toBOQItem } from '../calculators/classify'

export const BOQ_ENGINE_VERSION = '0.5.0'

/**
 * Build a full BOQDocument from a CommercialResult + (optional) EngineeringResult.
 *
 * The engine is pure and does not read from any global. Line items are re-
 * classified into 12 canonical BOQ sections; empty sections are still emitted
 * with an empty items array so the UI/PDF/Excel can rely on a stable schema.
 */
export function generateBOQ({ engineering, commercial, headerNotes }: BOQInputs): BOQDocument {
  // Bucket every commercial line item into its BOQ section.
  const buckets = new Map<BOQSectionId, BOQItem[]>()
  for (const sec of Object.keys(BOQ_SECTION_META) as BOQSectionId[]) buckets.set(sec, [])

  for (const line of commercial.lineItems) {
    const cls = classifyLine(line)
    if (!cls) continue
    buckets.get(cls.section)!.push(toBOQItem(line, cls.unit, true))
  }

  // Assemble the ordered sections. Every section is present, even if empty.
  const sections: BOQSection[] = (Object.keys(BOQ_SECTION_META) as BOQSectionId[])
    .map((id) => {
      const meta = BOQ_SECTION_META[id]
      const items = buckets.get(id) ?? []
      const subtotal = round2(items.reduce((a, i) => a + i.amount, 0))
      return {
        id,
        title: meta.title,
        description: headerNotes?.[id] ?? meta.description,
        items,
        subtotal,
      } satisfies BOQSection
    })
    .sort((a, b) => BOQ_SECTION_META[a.id].order - BOQ_SECTION_META[b.id].order)

  const grandSubtotal = round2(sections.reduce((a, s) => a + s.subtotal, 0))

  return {
    currency: commercial.currency,
    sections,
    grandSubtotal,
    discountAmount: commercial.discountAmount,
    priceBeforeTax: commercial.priceBeforeTax,
    taxLabel: commercial.tax.label,
    taxRatePercent: commercial.tax.ratePercent,
    taxAmount: commercial.taxAmount,
    grandTotal: commercial.sellingPrice,
    meta: {
      generatedAt: new Date().toISOString(),
      engineVersion: BOQ_ENGINE_VERSION,
      sourceEngineeringVersion: engineering?.engineVersion,
      sourceCommercialVersion: commercial.engineVersion,
    },
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
