/**
 * Sprint 6A — Cabinet catalog seed.
 *
 * Kept as a static, versioned TypeScript module: no DB round-trip needed to
 * populate the toolbox. Individual entries are referenced by `id` from placed
 * nodes so future catalog additions never rename existing IDs.
 */

import type { CabinetCatalogItem, CabinetCategory } from './types'

export const CABINET_CATALOG: readonly CabinetCatalogItem[] = [
  // ————————————————————————————— LED cabinets
  {
    id: 'absen-a3pro-500',
    category: 'led',
    name: 'Absen A3 Pro',
    manufacturer: 'Absen',
    widthMm: 500,
    heightMm: 500,
    pixelPitchMm: 3.9,
    resolution: '128×128',
    weightKg: 7.5,
    tag: 'Indoor · 3.9mm',
    accent: 'red',
  },
  {
    id: 'absen-pl25-500',
    category: 'led',
    name: 'Absen PL2.5 Pro',
    manufacturer: 'Absen',
    widthMm: 500,
    heightMm: 500,
    pixelPitchMm: 2.5,
    resolution: '200×200',
    weightKg: 8.0,
    tag: 'Studio · 2.5mm',
    accent: 'red',
  },
  {
    id: 'novastar-oc500',
    category: 'led',
    name: 'Nova OC500',
    manufacturer: 'NovaStar',
    widthMm: 500,
    heightMm: 500,
    pixelPitchMm: 1.9,
    resolution: '260×260',
    weightKg: 9.2,
    tag: 'Broadcast · 1.9mm',
    accent: 'emerald',
  },
  {
    id: 'unilumin-umini2-600',
    category: 'led',
    name: 'Unilumin UMini II',
    manufacturer: 'Unilumin',
    widthMm: 600,
    heightMm: 337,
    pixelPitchMm: 1.5,
    resolution: '400×225',
    weightKg: 6.8,
    tag: 'Fine · 1.5mm',
    accent: 'violet',
  },
  {
    id: 'roe-carbon-cb5',
    category: 'led',
    name: 'ROE Carbon CB5',
    manufacturer: 'ROE Visual',
    widthMm: 500,
    heightMm: 500,
    pixelPitchMm: 5.7,
    resolution: '88×88',
    weightKg: 5.9,
    tag: 'Rental · 5.7mm',
    accent: 'amber',
  },

  // ————————————————————————————— LCD panels
  {
    id: 'samsung-qmb-55',
    category: 'lcd',
    name: 'Samsung QM55B',
    manufacturer: 'Samsung',
    widthMm: 1214,
    heightMm: 684,
    resolution: '3840×2160',
    weightKg: 17.5,
    tag: '55" · 4K',
    accent: 'blue',
  },
  {
    id: 'lg-um5n-65',
    category: 'lcd',
    name: 'LG 65UM5N',
    manufacturer: 'LG',
    widthMm: 1451,
    heightMm: 818,
    resolution: '3840×2160',
    weightKg: 26.0,
    tag: '65" · 4K',
    accent: 'blue',
  },
  {
    id: 'philips-75bdl-4k',
    category: 'lcd',
    name: 'Philips 75BDL',
    manufacturer: 'Philips',
    widthMm: 1682,
    heightMm: 945,
    resolution: '3840×2160',
    weightKg: 35.2,
    tag: '75" · 4K',
    accent: 'blue',
  },

  // ————————————————————————————— Placeholder devices
  {
    id: 'ph-rack-600',
    category: 'placeholder',
    name: 'Equipment Rack',
    manufacturer: 'Generic',
    widthMm: 600,
    heightMm: 1000,
    tag: '19" Rack',
    accent: 'slate',
  },
  {
    id: 'ph-speaker-400',
    category: 'placeholder',
    name: 'Line Array Speaker',
    manufacturer: 'Generic',
    widthMm: 400,
    heightMm: 400,
    tag: 'Speaker',
    accent: 'slate',
  },
  {
    id: 'ph-camera-250',
    category: 'placeholder',
    name: 'PTZ Camera',
    manufacturer: 'Generic',
    widthMm: 250,
    heightMm: 250,
    tag: 'Camera',
    accent: 'slate',
  },
  {
    id: 'ph-door-900',
    category: 'placeholder',
    name: 'Door (Reference)',
    manufacturer: 'Reference',
    widthMm: 900,
    heightMm: 2100,
    tag: 'Reference',
    accent: 'slate',
  },
]

export const CATALOG_BY_ID: Readonly<Record<string, CabinetCatalogItem>> =
  Object.freeze(
    CABINET_CATALOG.reduce<Record<string, CabinetCatalogItem>>((acc, c) => {
      acc[c.id] = c
      return acc
    }, {}),
  )

export function findCatalog(id: string): CabinetCatalogItem | undefined {
  return CATALOG_BY_ID[id]
}

export const CATEGORY_LABEL: Record<CabinetCategory, string> = {
  led: 'LED Cabinets',
  lcd: 'LCD Panels',
  placeholder: 'Placeholder Devices',
}

export function catalogByCategory(): Record<CabinetCategory, CabinetCatalogItem[]> {
  const grouped: Record<CabinetCategory, CabinetCatalogItem[]> = {
    led: [], lcd: [], placeholder: [],
  }
  for (const item of CABINET_CATALOG) grouped[item.category].push(item)
  return grouped
}
