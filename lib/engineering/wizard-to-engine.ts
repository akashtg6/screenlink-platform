import type {
  ProjectData,
  DisplayFamily,
  EnvironmentType,
  ContentClass,
  InstallationType,
  Orientation,
} from '@/engineering-engine'
import type { ProjectWizardValues } from '@/lib/validation/project-schemas'

/**
 * Adapter — maps the wizard's UI form values to the pure Engineering Engine
 * `ProjectData` shape. Keeps engine free of UI/Zod coupling.
 *
 * @pure
 */
export function wizardValuesToProjectData(v: Partial<ProjectWizardValues> | null | undefined): ProjectData | null {
  if (!v) return null

  const width = numOrNaN(v.screenWidth)
  const height = numOrNaN(v.screenHeight)
  const pitch = numOrNaN(v.pixelPitchPreference)

  // Engine's hard requirements: width, height, measurementUnit, pixelPitchMm.
  if (!Number.isFinite(width) || width <= 0) return null
  if (!Number.isFinite(height) || height <= 0) return null
  if (!Number.isFinite(pitch) || pitch <= 0) return null

  const cabinet = parseCabinetSize(v.cabinetSize)

  // Take the farther of near/far as the design viewing distance (worst-case),
  // fall back to the nearer if only that is present.
  const viewingDistanceM =
    numOrUndef(v.farthestDistanceM) ??
    numOrUndef(v.nearestDistanceM)

  return {
    projectName: v.name || undefined,
    application: v.application || undefined,
    installationTypes: (v.installationTypes as InstallationType[] | undefined) ?? undefined,
    displayFamily: deriveDisplayFamily(v.installationTypes),
    width,
    height,
    measurementUnit: (v.measurementUnit ?? 'mm') as ProjectData['measurementUnit'],
    pixelPitchMm: pitch,
    cabinetWidthMm: cabinet?.widthMm,
    cabinetHeightMm: cabinet?.heightMm,
    viewingDistanceM,
    orientation: v.orientation as Orientation | undefined,
    environment: deriveEnvironment(v.installationTypes, v.directSunlight),
    operationHoursPerDay: numOrUndef(v.operationHoursPerDay),
    contentType: v.contentType as ContentClass | undefined,
    extras: {
      maintenanceAccess: v.maintenanceAccess,
      ambientLight: v.ambientLight,
      priority: v.priority,
      displayQuantity: numOrUndef(v.displayQuantity),
      voltage: v.voltage || undefined,
      availablePowerKw: numOrUndef(v.availablePowerKw),
      ups: v.ups,
      generator: v.generator,
      remoteMonitoring: v.remoteMonitoring,
    },
  }
}

/** Parse strings like "500x500 mm", "600×337.5", "500 x 500" into mm. */
export function parseCabinetSize(input?: string | null): { widthMm: number; heightMm: number } | undefined {
  if (!input) return undefined
  const cleaned = input
    .replace(/mm|millimet(re|er)s?/gi, '')
    .replace(/[×xX*]/g, 'x')
    .replace(/\s+/g, '')
  const m = cleaned.match(/^([\d.]+)x([\d.]+)$/)
  if (!m) return undefined
  const w = parseFloat(m[1])
  const h = parseFloat(m[2])
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return undefined
  return { widthMm: w, heightMm: h }
}

function deriveDisplayFamily(types?: string[]): DisplayFamily | undefined {
  if (!types || types.length === 0) return undefined
  if (types.includes('lcd_video_wall')) return 'lcd'
  if (types.includes('transparent')) return 'transparent'
  if (types.includes('led') || types.includes('indoor') || types.includes('outdoor') || types.includes('rental') || types.includes('creative')) return 'led'
  return 'led'
}

function deriveEnvironment(types?: string[], directSunlight?: boolean): EnvironmentType | undefined {
  if (types?.includes('outdoor')) return 'outdoor'
  if (directSunlight) return 'semi_outdoor'
  if (types?.includes('indoor') || types?.includes('lcd_video_wall') || types?.includes('interactive')) return 'indoor'
  return undefined
}

function numOrUndef(n: unknown): number | undefined {
  if (typeof n !== 'number') return undefined
  if (!Number.isFinite(n)) return undefined
  return n
}
function numOrNaN(n: unknown): number {
  if (typeof n !== 'number') return NaN
  return n
}
