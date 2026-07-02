import { z } from 'zod'

import type { Customer, Requirements } from '@/types'

// Step 1 — Project Information
export const stepInfoSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  code: z.string().optional().or(z.literal('')),
  customerName: z.string().min(2, 'Customer name is required'),
  consultant: z.string().optional().or(z.literal('')),
  integrator: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  application: z.enum([
    'corporate','retail','transport','stadium','broadcast','control_room','hospitality','education','other',
  ]).optional(),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['low','medium','high','critical']).optional(),
  targetCompletionDate: z.string().optional().or(z.literal('')),
})

// Step 2 — Installation
export const stepInstallationSchema = z.object({
  installationTypes: z
    .array(z.enum([
      'indoor','outdoor','rental','transparent','interactive','creative','lcd_video_wall','led','custom',
    ]))
    .min(1, 'Select at least one installation type'),
  mountingType: z.enum(['wall','pole','floor','hanging','ceiling']).optional(),
  maintenanceAccess: z.enum(['front','rear','both']).optional(),
})

// Step 3 — Display
export const stepDisplaySchema = z.object({
  screenWidth: z.coerce.number().positive('Enter a positive number').optional().or(z.nan()),
  screenHeight: z.coerce.number().positive('Enter a positive number').optional().or(z.nan()),
  measurementUnit: z.enum(['mm','cm','m','inch']),
  pixelPitchPreference: z.coerce.number().positive().optional().or(z.nan()),
  cabinetSize: z.string().optional().or(z.literal('')),
  preferredResolution: z.string().optional().or(z.literal('')),
  orientation: z.enum(['landscape','portrait','curved','corner','custom_shape']).optional(),
  displayQuantity: z.coerce.number().int().positive().optional().or(z.nan()),
})

// Step 4 — Viewing
export const stepViewingSchema = z.object({
  nearestDistanceM: z.coerce.number().positive().optional().or(z.nan()),
  farthestDistanceM: z.coerce.number().positive().optional().or(z.nan()),
  viewingHeightM: z.coerce.number().nonnegative().optional().or(z.nan()),
  viewingAngle: z.coerce.number().min(0).max(180).optional().or(z.nan()),
  contentType: z.enum([
    'powerpoint','video','broadcast','control_room','dashboard','advertising','gaming','mixed',
  ]).optional(),
  ambientLight: z.enum(['low','medium','high']).optional(),
  directSunlight: z.boolean().optional(),
  operationHoursPerDay: z.coerce.number().min(0).max(24).optional().or(z.nan()),
})

// Step 5 — Electrical
export const stepElectricalSchema = z.object({
  voltage: z.string().optional().or(z.literal('')),
  availablePowerKw: z.coerce.number().positive().optional().or(z.nan()),
  ups: z.boolean().optional(),
  generator: z.boolean().optional(),
  internet: z.array(z.enum(['lan','wifi','fiber'])).optional(),
  remoteMonitoring: z.boolean().optional(),
})

// Full form — all steps combined
export const projectWizardSchema = stepInfoSchema
  .merge(stepInstallationSchema)
  .merge(stepDisplaySchema)
  .merge(stepViewingSchema)
  .merge(stepElectricalSchema)

export type StepInfoValues = z.infer<typeof stepInfoSchema>
export type StepInstallationValues = z.infer<typeof stepInstallationSchema>
export type StepDisplayValues = z.infer<typeof stepDisplaySchema>
export type StepViewingValues = z.infer<typeof stepViewingSchema>
export type StepElectricalValues = z.infer<typeof stepElectricalSchema>
export type ProjectWizardValues = z.infer<typeof projectWizardSchema>

export const WIZARD_DEFAULTS: ProjectWizardValues = {
  name: '',
  code: '',
  customerName: '',
  consultant: '',
  integrator: '',
  country: '',
  city: '',
  application: undefined,
  description: '',
  priority: undefined,
  targetCompletionDate: '',
  installationTypes: [],
  mountingType: undefined,
  maintenanceAccess: undefined,
  screenWidth: undefined as unknown as number,
  screenHeight: undefined as unknown as number,
  measurementUnit: 'mm',
  pixelPitchPreference: undefined as unknown as number,
  cabinetSize: '',
  preferredResolution: '',
  orientation: undefined,
  displayQuantity: undefined as unknown as number,
  nearestDistanceM: undefined as unknown as number,
  farthestDistanceM: undefined as unknown as number,
  viewingHeightM: undefined as unknown as number,
  viewingAngle: undefined as unknown as number,
  contentType: undefined,
  ambientLight: undefined,
  directSunlight: undefined,
  operationHoursPerDay: undefined as unknown as number,
  voltage: '',
  availablePowerKw: undefined as unknown as number,
  ups: undefined,
  generator: undefined,
  internet: [],
  remoteMonitoring: undefined,
}

/** Fields that count toward completion percentage. */
export const WIZARD_TRACKED_FIELDS: (keyof ProjectWizardValues)[] = [
  'name', 'customerName', 'country', 'city', 'application', 'priority', 'targetCompletionDate',
  'installationTypes', 'mountingType', 'maintenanceAccess',
  'screenWidth', 'screenHeight', 'measurementUnit', 'pixelPitchPreference', 'orientation', 'displayQuantity',
  'nearestDistanceM', 'farthestDistanceM', 'contentType', 'ambientLight', 'operationHoursPerDay',
  'voltage', 'availablePowerKw', 'remoteMonitoring',
]

export function computeProgress(values: Partial<ProjectWizardValues>): number {
  let filled = 0
  for (const f of WIZARD_TRACKED_FIELDS) {
    const v = (values as Record<string, unknown>)[f]
    if (Array.isArray(v)) {
      if (v.length > 0) filled++
    } else if (typeof v === 'boolean') {
      if (v) filled++
    } else if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && Number.isNaN(v))) {
      filled++
    }
  }
  return Math.round((filled / WIZARD_TRACKED_FIELDS.length) * 100)
}

export function valuesToProjectPatch(v: ProjectWizardValues) {
  return {
    name: v.name,
    code: v.code || undefined,
    description: v.description || undefined,
    priority: v.priority,
    targetCompletionDate: v.targetCompletionDate || undefined,
    location: [v.city, v.country].filter(Boolean).join(', ') || undefined,
    customer: {
      name: v.customerName,
      consultant: v.consultant || undefined,
      integrator: v.integrator || undefined,
      country: v.country || undefined,
      city: v.city || undefined,
    },
    requirements: {
      application: v.application,
      installation: {
        types: v.installationTypes || [],
        mountingType: v.mountingType,
        maintenanceAccess: v.maintenanceAccess,
      },
      display: {
        screenWidth: numOrUndef(v.screenWidth),
        screenHeight: numOrUndef(v.screenHeight),
        measurementUnit: v.measurementUnit,
        pixelPitchPreference: numOrUndef(v.pixelPitchPreference),
        cabinetSize: v.cabinetSize || undefined,
        preferredResolution: v.preferredResolution || undefined,
        orientation: v.orientation,
        displayQuantity: numOrUndef(v.displayQuantity),
      },
      viewing: {
        nearestDistanceM: numOrUndef(v.nearestDistanceM),
        farthestDistanceM: numOrUndef(v.farthestDistanceM),
        viewingHeightM: numOrUndef(v.viewingHeightM),
        viewingAngle: numOrUndef(v.viewingAngle),
        contentType: v.contentType,
        ambientLight: v.ambientLight,
        directSunlight: v.directSunlight,
        operationHoursPerDay: numOrUndef(v.operationHoursPerDay),
      },
      electrical: {
        voltage: v.voltage || undefined,
        availablePowerKw: numOrUndef(v.availablePowerKw),
        ups: v.ups,
        generator: v.generator,
        internet: v.internet || [],
        remoteMonitoring: v.remoteMonitoring,
      },
    },
  }
}

export function projectToValues(p: {
  name: string; code?: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'
  targetCompletionDate?: string; customer: Customer; requirements: Requirements
}): ProjectWizardValues {
  const req = (p.requirements || {}) as unknown as Record<string, Record<string, unknown>>
  const c = (p.customer || {}) as unknown as Record<string, string>
  const inst = (req.installation || {}) as Record<string, unknown>
  const disp = (req.display || {}) as Record<string, unknown>
  const view = (req.viewing || {}) as Record<string, unknown>
  const elec = (req.electrical || {}) as Record<string, unknown>
  return {
    name: p.name || '',
    code: p.code || '',
    customerName: c.name || '',
    consultant: c.consultant || '',
    integrator: c.integrator || '',
    country: c.country || '',
    city: c.city || '',
    application: (req.application as unknown as ProjectWizardValues['application']) || undefined,
    description: p.description || '',
    priority: p.priority || undefined,
    targetCompletionDate: p.targetCompletionDate || '',
    installationTypes: (inst.types as ProjectWizardValues['installationTypes']) || [],
    mountingType: inst.mountingType as ProjectWizardValues['mountingType'],
    maintenanceAccess: inst.maintenanceAccess as ProjectWizardValues['maintenanceAccess'],
    screenWidth: (disp.screenWidth as number) ?? (undefined as unknown as number),
    screenHeight: (disp.screenHeight as number) ?? (undefined as unknown as number),
    measurementUnit: (disp.measurementUnit as ProjectWizardValues['measurementUnit']) || 'mm',
    pixelPitchPreference: (disp.pixelPitchPreference as number) ?? (undefined as unknown as number),
    cabinetSize: (disp.cabinetSize as string) || '',
    preferredResolution: (disp.preferredResolution as string) || '',
    orientation: disp.orientation as ProjectWizardValues['orientation'],
    displayQuantity: (disp.displayQuantity as number) ?? (undefined as unknown as number),
    nearestDistanceM: (view.nearestDistanceM as number) ?? (undefined as unknown as number),
    farthestDistanceM: (view.farthestDistanceM as number) ?? (undefined as unknown as number),
    viewingHeightM: (view.viewingHeightM as number) ?? (undefined as unknown as number),
    viewingAngle: (view.viewingAngle as number) ?? (undefined as unknown as number),
    contentType: view.contentType as ProjectWizardValues['contentType'],
    ambientLight: view.ambientLight as ProjectWizardValues['ambientLight'],
    directSunlight: view.directSunlight as boolean | undefined,
    operationHoursPerDay: (view.operationHoursPerDay as number) ?? (undefined as unknown as number),
    voltage: (elec.voltage as string) || '',
    availablePowerKw: (elec.availablePowerKw as number) ?? (undefined as unknown as number),
    ups: elec.ups as boolean | undefined,
    generator: elec.generator as boolean | undefined,
    internet: (elec.internet as ProjectWizardValues['internet']) || [],
    remoteMonitoring: elec.remoteMonitoring as boolean | undefined,
  }
}

function numOrUndef(n: unknown): number | undefined {
  if (typeof n !== 'number') return undefined
  if (Number.isNaN(n)) return undefined
  return n
}
