import type { LineItem } from '@/commercial-engine'
import type { BOQItem, BOQSectionId } from '../models/boq-document'

/**
 * Maps every commercial line item to one of the 12 BOQ sections. Additive:
 * new commercial line prefixes just need an entry here.
 */
const PREFIX_TO_SECTION: ReadonlyArray<[RegExp, BOQSectionId, string]> = [
  [/^mat-led-/,           'display',         'nos'],
  [/^mat-cabinet-/,       'cabinets',        'nos'],
  [/^mat-controller-/,    'controllers',     'nos'],
  [/^mat-receiver-/,      'receiving_cards', 'nos'],
  [/^mat-psu-/,           'power_supplies',  'nos'],
  [/^mat-cables-/,        'cables',          'lot'],
  [/^infra-steel-/,       'steel',           'lot'],
  [/^mat-accessories-/,   'accessories',     'lot'],
  [/^svc-install-/,       'installation',    'lot'],
  [/^svc-commission-/,    'commissioning',   'lot'],
  [/^warranty-/,          'warranty',        'year'],
  [/^amc-/,               'amc',             'year'],
]

export function classifyLine(line: LineItem): { section: BOQSectionId; unit: string } | undefined {
  for (const [pattern, section, defaultUnit] of PREFIX_TO_SECTION) {
    if (pattern.test(line.id)) return { section, unit: line.unit || defaultUnit }
  }
  // Custom / infrastructure-transport / other lines land in installation or
  // accessories depending on category.
  if (/^infra-transport-/.test(line.id)) return { section: 'installation', unit: line.unit || 'lot' }
  if (line.category === 'material') return { section: 'accessories', unit: line.unit || 'lot' }
  if (line.category === 'services' || line.category === 'labor' || line.category === 'installation') {
    return { section: 'installation', unit: line.unit || 'lot' }
  }
  return undefined
}

export function toBOQItem(line: LineItem, unit: string, editable = true): BOQItem {
  return {
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unit,
    unitPrice: line.unitPrice,
    amount: line.amount,
    editable,
    meta: line.meta,
  }
}
