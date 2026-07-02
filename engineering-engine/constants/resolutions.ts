/**
 * Standard resolution buckets used to classify a computed pixel canvas.
 * The engine classifies by *total pixel count* (with tolerance) and then
 * verifies horizontal + vertical fall within the expected ranges.
 */
export interface ResolutionClass {
  readonly name: string          // 'Full HD', 'UHD 4K', 'Custom', ...
  readonly shortName: string     // 'FHD', '4K', ...
  readonly nominalWidth: number  // 1920
  readonly nominalHeight: number // 1080
  readonly nominalPixels: number // 2_073_600
}

export const RESOLUTION_CLASSES: readonly ResolutionClass[] = [
  { name: 'nHD',        shortName: 'nHD',   nominalWidth: 640,   nominalHeight: 360,  nominalPixels: 230_400 },
  { name: 'HD',         shortName: 'HD',    nominalWidth: 1280,  nominalHeight: 720,  nominalPixels: 921_600 },
  { name: 'HD+',        shortName: 'HD+',   nominalWidth: 1600,  nominalHeight: 900,  nominalPixels: 1_440_000 },
  { name: 'Full HD',    shortName: 'FHD',   nominalWidth: 1920,  nominalHeight: 1080, nominalPixels: 2_073_600 },
  { name: '2K',         shortName: '2K',    nominalWidth: 2048,  nominalHeight: 1080, nominalPixels: 2_211_840 },
  { name: 'QHD',        shortName: 'QHD',   nominalWidth: 2560,  nominalHeight: 1440, nominalPixels: 3_686_400 },
  { name: 'UHD 4K',     shortName: '4K',    nominalWidth: 3840,  nominalHeight: 2160, nominalPixels: 8_294_400 },
  { name: 'DCI 4K',     shortName: '4K DCI',nominalWidth: 4096,  nominalHeight: 2160, nominalPixels: 8_847_360 },
  { name: '5K',         shortName: '5K',    nominalWidth: 5120,  nominalHeight: 2880, nominalPixels: 14_745_600 },
  { name: '8K',         shortName: '8K',    nominalWidth: 7680,  nominalHeight: 4320, nominalPixels: 33_177_600 },
]

/** Fractional tolerance for matching a computed resolution to a class. */
export const RESOLUTION_TOLERANCE = 0.10
