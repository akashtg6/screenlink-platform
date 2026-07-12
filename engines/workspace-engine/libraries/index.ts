/**
 * Sprint 6B — Workspace Engine · libraries
 *
 * Generalised catalog. Not cabinet-specific: it accepts any hardware category
 * that may live on the canvas or in a BOQ. Each `LibraryItem.category` maps
 * 1:1 with a WorkspaceObject.kind so the drop path stays trivial.
 */

import type { AccentColor, ObjectKind, WorkspaceObject } from '../types'
import { newObjectId } from '../utils'
import { snapValue } from '../snap'
import { LED_CABINETS } from './led-cabinets'
import { LCD_PANELS } from './lcd-panels'
import { CONTROLLERS } from './controllers'
import { RECEIVING_CARDS } from './receiving-cards'
import { SENDING_CARDS } from './sending-cards'
import { POWER_SUPPLIES } from './power-supplies'
import { MEDIA_PLAYERS } from './media-players'
import { ACCESSORIES } from './accessories'
import { PLACEHOLDERS } from './placeholders'

export type LibraryCategory =
  | 'led-cabinet'
  | 'lcd-panel'
  | 'controller'
  | 'receiving-card'
  | 'sending-card'
  | 'power-supply'
  | 'media-player'
  | 'accessory'
  | 'placeholder'

export interface Manufacturer {
  id: string
  name: string
  websiteUrl?: string
}

export interface LibraryItem {
  id: string
  category: LibraryCategory
  name: string
  manufacturer: string
  widthMm: number
  heightMm: number
  /** LED cabinets only. */
  pixelPitchMm?: number
  /** "3840x2160", "128x128", etc. */
  resolution?: string
  weightKg?: number
  powerW?: number
  tag?: string
  accent: AccentColor
  /** Free-form spec sheet URL / part number / etc. */
  meta?: Record<string, unknown>
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

export interface LibraryRegistry {
  items(): LibraryItem[]
  itemsByCategory(): Record<LibraryCategory, LibraryItem[]>
  find(id: string): LibraryItem | undefined
  register(items: LibraryItem[]): void
  manufacturers(): Manufacturer[]
}

export function createLibraryRegistry(seed: LibraryItem[] = ALL_LIBRARY_ITEMS): LibraryRegistry {
  const items = new Map<string, LibraryItem>()
  for (const it of seed) items.set(it.id, it)

  return {
    items: () => Array.from(items.values()),
    itemsByCategory() {
      const empty: Record<LibraryCategory, LibraryItem[]> = {
        'led-cabinet': [], 'lcd-panel': [], 'controller': [], 'receiving-card': [],
        'sending-card': [], 'power-supply': [], 'media-player': [], 'accessory': [], 'placeholder': [],
      }
      for (const it of items.values()) empty[it.category].push(it)
      return empty
    },
    find: (id) => items.get(id),
    register(list) { for (const it of list) items.set(it.id, it) },
    manufacturers() {
      const seen = new Map<string, Manufacturer>()
      for (const it of items.values()) {
        if (!seen.has(it.manufacturer)) seen.set(it.manufacturer, { id: slug(it.manufacturer), name: it.manufacturer })
      }
      return Array.from(seen.values())
    },
  }
}

function slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

/* -------------------------------------------------------------------------- */
/* LibraryCategory ↔ ObjectKind mapping                                       */
/* -------------------------------------------------------------------------- */

export const CATEGORY_TO_KIND: Record<LibraryCategory, ObjectKind> = {
  'led-cabinet':    'cabinet',
  'lcd-panel':      'lcd',
  'controller':     'controller',
  'receiving-card': 'receiving-card',
  'sending-card':   'sending-card',
  'power-supply':   'power-supply',
  'media-player':   'media-player',
  'accessory':      'accessory',
  'placeholder':    'placeholder',
}

export const CATEGORY_LABEL: Record<LibraryCategory, string> = {
  'led-cabinet':    'LED Cabinets',
  'lcd-panel':      'LCD Panels',
  'controller':     'Controllers',
  'receiving-card': 'Receiving Cards',
  'sending-card':   'Sending Cards',
  'power-supply':   'Power Supplies',
  'media-player':   'Media Players',
  'accessory':      'Accessories',
  'placeholder':    'Placeholders',
}

/* -------------------------------------------------------------------------- */
/* WorkspaceObject factory                                                     */
/* -------------------------------------------------------------------------- */

export function objectFromLibrary(
  item: LibraryItem,
  worldX: number,
  worldY: number,
  layerId: string,
  zIndex: number,
  snapStepMm = 10,
): WorkspaceObject {
  const base = {
    id: newObjectId(),
    name: item.name,
    x: snapValue(worldX - item.widthMm / 2, snapStepMm),
    y: snapValue(worldY - item.heightMm / 2, snapStepMm),
    width: item.widthMm,
    height: item.heightMm,
    rotation: 0,
    layerId,
    locked: false,
    visible: true,
    zIndex,
    groupId: null,
    libraryItemId: item.id,
  }

  const kind = CATEGORY_TO_KIND[item.category]
  const res = parseRes(item.resolution)

  switch (kind) {
    case 'cabinet':
      return { ...base, kind: 'cabinet', manufacturer: item.manufacturer, pixelPitchMm: item.pixelPitchMm ?? 0,
        resolution: res ?? { w: 0, h: 0 }, weightKg: item.weightKg, powerW: item.powerW, accent: item.accent }
    case 'lcd':
      return { ...base, kind: 'lcd', manufacturer: item.manufacturer, resolution: res ?? { w: 0, h: 0 },
        weightKg: item.weightKg, accent: item.accent }
    case 'controller':
      return { ...base, kind: 'controller', manufacturer: item.manufacturer,
        maxPixels: (item.meta?.maxPixels as number | undefined), outputs: (item.meta?.outputs as number | undefined),
        accent: item.accent }
    case 'receiving-card':
      return { ...base, kind: 'receiving-card', manufacturer: item.manufacturer, accent: item.accent }
    case 'sending-card':
      return { ...base, kind: 'sending-card', manufacturer: item.manufacturer,
        outputs: (item.meta?.outputs as number | undefined), accent: item.accent }
    case 'power-supply':
      return { ...base, kind: 'power-supply', manufacturer: item.manufacturer,
        wattage: item.powerW, accent: item.accent }
    case 'media-player':
      return { ...base, kind: 'media-player', manufacturer: item.manufacturer, accent: item.accent }
    case 'accessory':
      return { ...base, kind: 'accessory', manufacturer: item.manufacturer, accent: item.accent }
    default:
      return { ...base, kind: 'placeholder', manufacturer: item.manufacturer, accent: item.accent }
  }
}

function parseRes(s: string | undefined): { w: number; h: number } | undefined {
  if (!s) return undefined
  const m = /^(\d+)\s*[x×]\s*(\d+)$/.exec(s.trim())
  return m ? { w: Number(m[1]), h: Number(m[2]) } : undefined
}

/* -------------------------------------------------------------------------- */
/* Built-in library                                                            */
/* -------------------------------------------------------------------------- */

export const ALL_LIBRARY_ITEMS: LibraryItem[] = [
  ...LED_CABINETS,
  ...LCD_PANELS,
  ...CONTROLLERS,
  ...RECEIVING_CARDS,
  ...SENDING_CARDS,
  ...POWER_SUPPLIES,
  ...MEDIA_PLAYERS,
  ...ACCESSORIES,
  ...PLACEHOLDERS,
]

export { LED_CABINETS, LCD_PANELS, CONTROLLERS, RECEIVING_CARDS, SENDING_CARDS, POWER_SUPPLIES, MEDIA_PLAYERS, ACCESSORIES, PLACEHOLDERS }

export const DEFAULT_LIBRARY = createLibraryRegistry()
