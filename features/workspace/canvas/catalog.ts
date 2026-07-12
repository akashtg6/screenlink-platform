/**
 * Sprint 6B — legacy `catalog` shim.
 *
 * Sprint 6A shipped a cabinet-only catalog. Sprint 6B promotes it to a
 * general-purpose **library** covering LED cabinets, LCD panels, controllers,
 * receiving/sending cards, power supplies, media players, accessories, and
 * placeholders. The old `CABINET_CATALOG` array is now a filtered view over
 * the library so Sprint 6A UI keeps working unchanged.
 */

import {
  DEFAULT_LIBRARY,
  CATEGORY_LABEL as ENGINE_LABEL,
  type LibraryItem,
  type LibraryCategory,
} from '@/engines/workspace-engine'

/** Sprint 6A category slugs, kept for the UI's category filter. */
export type CabinetCategory = 'led' | 'lcd' | 'placeholder'

/** Adapter type that mirrors the Sprint 6A cabinet card. */
export interface CabinetCatalogItem {
  id: string
  category: CabinetCategory
  name: string
  manufacturer: string
  widthMm: number
  heightMm: number
  pixelPitchMm?: number
  resolution?: string
  weightKg?: number
  tag?: string
  accent: LibraryItem['accent']
}

const SHOW_IN_TOOLBOX: LibraryCategory[] = ['led-cabinet', 'lcd-panel', 'placeholder']

function toLegacy(item: LibraryItem): CabinetCatalogItem {
  const cat: CabinetCategory =
    item.category === 'led-cabinet' ? 'led' :
    item.category === 'lcd-panel'   ? 'lcd' : 'placeholder'
  return {
    id: item.id, category: cat, name: item.name, manufacturer: item.manufacturer,
    widthMm: item.widthMm, heightMm: item.heightMm,
    pixelPitchMm: item.pixelPitchMm, resolution: item.resolution,
    weightKg: item.weightKg, tag: item.tag, accent: item.accent,
  }
}

export const CABINET_CATALOG: readonly CabinetCatalogItem[] =
  DEFAULT_LIBRARY.items().filter((i) => SHOW_IN_TOOLBOX.includes(i.category)).map(toLegacy)

export const CATALOG_BY_ID: Readonly<Record<string, CabinetCatalogItem>> = Object.freeze(
  CABINET_CATALOG.reduce<Record<string, CabinetCatalogItem>>((acc, c) => { acc[c.id] = c; return acc }, {}),
)

export function findCatalog(id: string): CabinetCatalogItem | undefined {
  return CATALOG_BY_ID[id]
}

export const CATEGORY_LABEL: Record<CabinetCategory, string> = {
  led: ENGINE_LABEL['led-cabinet'],
  lcd: ENGINE_LABEL['lcd-panel'],
  placeholder: ENGINE_LABEL['placeholder'],
}

export function catalogByCategory(): Record<CabinetCategory, CabinetCatalogItem[]> {
  const grouped: Record<CabinetCategory, CabinetCatalogItem[]> = { led: [], lcd: [], placeholder: [] }
  for (const item of CABINET_CATALOG) grouped[item.category].push(item)
  return grouped
}
