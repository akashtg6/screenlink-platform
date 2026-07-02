/**
 * ScreenLink.ai Engineering Engine — Constants
 * Standard aspect ratios used across professional display engineering.
 */
export interface StandardAspectRatio {
  readonly name: string        // e.g. '16:9'
  readonly ratio: number       // width / height, e.g. 1.777...
  readonly widthUnits: number  // 16
  readonly heightUnits: number // 9
  readonly nickname?: string   // 'Widescreen', 'CinemaScope', ...
}

export const STANDARD_ASPECT_RATIOS: readonly StandardAspectRatio[] = [
  { name: '1:1',   ratio: 1 / 1,   widthUnits: 1,  heightUnits: 1, nickname: 'Square' },
  { name: '5:4',   ratio: 5 / 4,   widthUnits: 5,  heightUnits: 4, nickname: 'Classic monitor' },
  { name: '4:3',   ratio: 4 / 3,   widthUnits: 4,  heightUnits: 3, nickname: 'Standard TV' },
  { name: '3:2',   ratio: 3 / 2,   widthUnits: 3,  heightUnits: 2, nickname: 'Photography' },
  { name: '16:10', ratio: 16 / 10, widthUnits: 16, heightUnits: 10, nickname: 'WUXGA / MacBook' },
  { name: '16:9',  ratio: 16 / 9,  widthUnits: 16, heightUnits: 9, nickname: 'Widescreen HD' },
  { name: '2:1',   ratio: 2 / 1,   widthUnits: 2,  heightUnits: 1, nickname: 'Univisium' },
  { name: '21:9',  ratio: 21 / 9,  widthUnits: 21, heightUnits: 9, nickname: 'UltraWide / CinemaScope' },
  { name: '32:9',  ratio: 32 / 9,  widthUnits: 32, heightUnits: 9, nickname: 'Super UltraWide' },
] as const

/** Default tolerance (fraction) when comparing an actual ratio to a standard one. */
export const ASPECT_RATIO_TOLERANCE = 0.03
