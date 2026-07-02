'use client'

import * as React from 'react'
import type { Project, Requirements } from '@/types'
import { calculateEngineering, type EngineeringResult, type ProjectData } from '@/engineering-engine'
import {
  calculateCommercial, COMMERCIAL_DEFAULTS, DEFAULT_CURRENCY,
  type CommercialInput, type CommercialResult, type CurrencyCode,
} from '@/commercial-engine'
import { generateBOQ, type BOQDocument } from '@/boq-engine'
import { generateProposal, mergeBranding, type ProposalDocument } from '@/proposal-engine'
import { wizardValuesToProjectData } from '@/lib/engineering/wizard-to-engine'
import { projectToValues } from '@/lib/validation/project-schemas'

/**
 * WorkspaceProvider — the reactive nerve centre of the Release 0.5 workspace.
 *
 * Rules:
 *   - Owns the transient state of the workspace (commercial input, section
 *     open/close, cabinet-grid viewport).
 *   - Re-derives Engineering → Commercial → BOQ → Proposal on any change.
 *   - Never calls engines' internals — uses their public entry points only.
 *   - Never modifies the Engineering Engine or the DB schema.
 */

export interface WorkspaceContextValue {
  project: Project
  projectData: ProjectData | null
  engineering: EngineeringResult | null

  commercialInput: CommercialInput
  setCommercialInput: React.Dispatch<React.SetStateAction<CommercialInput>>
  updateCommercial: (patch: Partial<CommercialInput>) => void

  commercial: CommercialResult
  boq: BOQDocument
  proposal: ProposalDocument

  isReady: boolean            // engineering could be computed
  lastRecalcMs: number        // total time engineering + commercial + boq + proposal took
}

const Ctx = React.createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const v = React.useContext(Ctx)
  if (!v) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return v
}

interface Props {
  project: Project
  children: React.ReactNode
}

export function WorkspaceProvider({ project, children }: Props) {
  // —— 1. Reduce the persisted wizard/requirements payload to ProjectData.
  const projectData: ProjectData | null = React.useMemo(() => {
    try {
      const values = projectToValues({
        name: project.name, code: project.code, description: project.description,
        priority: project.priority, targetCompletionDate: project.targetCompletionDate,
        customer: project.customer, requirements: project.requirements,
      })
      return wizardValuesToProjectData(values)
    } catch {
      return null
    }
  }, [project])

  // —— 2. Commercial input — seeded from projects.requirements.commercial JSONB.
  const initialCommercial = React.useMemo<CommercialInput>(
    () => hydrateCommercial(project.requirements),
    [project.requirements],
  )
  const [commercialInput, setCommercialInput] = React.useState<CommercialInput>(initialCommercial)

  const updateCommercial = React.useCallback((patch: Partial<CommercialInput>) => {
    setCommercialInput((prev) => ({ ...prev, ...patch }))
  }, [])

  // —— 3. Derive everything reactively.
  const derived = React.useMemo(() => {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const engineering = projectData ? calculateEngineering(projectData) : null
    const commercial = calculateCommercial(commercialInput, engineering ?? undefined)
    const boq = generateBOQ({ engineering: engineering ?? undefined, commercial })
    const proposal = generateProposal({
      branding: mergeBranding(),
      customer: {
        name: project.customer?.name || 'Customer',
        organization: project.customer?.company || project.customer?.name || 'Customer',
        contactPerson: project.customer?.consultant,
        email: project.customer?.email,
        phone: project.customer?.phone,
        address: [project.customer?.city, project.customer?.country].filter(Boolean).join(', ') || undefined,
      },
      project: {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        application: project.requirements?.application,
        siteAddress: project.location,
        targetCompletionDate: project.targetCompletionDate,
        proposalNumber: `${project.code || project.id.slice(0, 8)}`,
        proposalDate: new Date().toISOString(),
        revision: 'R0',
      },
      engineering: engineering ?? placeholderEngineering(),
      commercial, boq,
    })
    const lastRecalcMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    return { engineering, commercial, boq, proposal, lastRecalcMs }
  }, [projectData, commercialInput, project])

  const value: WorkspaceContextValue = {
    project,
    projectData,
    engineering: derived.engineering,
    commercialInput,
    setCommercialInput,
    updateCommercial,
    commercial: derived.commercial,
    boq: derived.boq,
    proposal: derived.proposal,
    isReady: !!derived.engineering,
    lastRecalcMs: derived.lastRecalcMs,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/* -------------------------------------------------------------------------- */

function hydrateCommercial(req: Requirements): CommercialInput {
  const persisted = (req?.commercial ?? {}) as Partial<CommercialInput> & { currency?: string }
  const currency: CurrencyCode = (persisted.currency as CurrencyCode) || DEFAULT_CURRENCY
  return {
    currency,
    ledCostPerSqM:            n(persisted.ledCostPerSqM,            COMMERCIAL_DEFAULTS.fallbackLedCostPerSqM),
    cabinetCostPerUnit:       n(persisted.cabinetCostPerUnit,       COMMERCIAL_DEFAULTS.fallbackCabinetCost),
    controllerCost:           n(persisted.controllerCost,           COMMERCIAL_DEFAULTS.fallbackControllerCost),
    controllerQuantity:       n(persisted.controllerQuantity,       undefined),
    receivingCardCostPerUnit: n(persisted.receivingCardCostPerUnit, COMMERCIAL_DEFAULTS.fallbackReceivingCardCost),
    powerSupplyCostPerUnit:   n(persisted.powerSupplyCostPerUnit,   COMMERCIAL_DEFAULTS.fallbackPowerSupplyCost),
    cablesCost:               n(persisted.cablesCost,               COMMERCIAL_DEFAULTS.fallbackCablesCost),
    accessoriesCost:          n(persisted.accessoriesCost,          COMMERCIAL_DEFAULTS.fallbackAccessoriesCost),
    steelStructureCost:       n(persisted.steelStructureCost,       COMMERCIAL_DEFAULTS.fallbackSteelCost),
    transportationCost:       n(persisted.transportationCost,       COMMERCIAL_DEFAULTS.fallbackTransportationCost),
    installationCost:         n(persisted.installationCost,         COMMERCIAL_DEFAULTS.fallbackInstallationCost),
    commissioningCost:        n(persisted.commissioningCost,        COMMERCIAL_DEFAULTS.fallbackCommissioningCost),
    marginPercent:            n(persisted.marginPercent,            COMMERCIAL_DEFAULTS.marginPercent),
    discountPercent:          n(persisted.discountPercent,          COMMERCIAL_DEFAULTS.discountPercent),
    warrantyYears:            n(persisted.warrantyYears,            COMMERCIAL_DEFAULTS.warrantyYears),
    warrantyCostPercent:      n(persisted.warrantyCostPercent,      COMMERCIAL_DEFAULTS.warrantyCostPercent),
    amcYears:                 n(persisted.amcYears,                 COMMERCIAL_DEFAULTS.amcYears),
    amcCostPercentPerYear:    n(persisted.amcCostPercentPerYear,    COMMERCIAL_DEFAULTS.amcCostPercentPerYear),
    tax: (persisted.tax as CommercialInput['tax']) ?? COMMERCIAL_DEFAULTS.defaultTax,
  }
}

function n(value: unknown, fallback: number | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return fallback
}

/** Minimal, safe placeholder used only when engineering can't be computed. */
function placeholderEngineering(): EngineeringResult {
  return {
    ok: false, errors: [], warnings: [], notes: [],
    aspectRatio: {} as EngineeringResult['aspectRatio'],
    geometry: { areaSqM: 0 } as EngineeringResult['geometry'],
    resolution: {} as EngineeringResult['resolution'],
    pixelDensity: {} as EngineeringResult['pixelDensity'],
    engineVersion: 'n/a',
    calculationTimeMs: 0,
    generatedAt: new Date().toISOString(),
  } as unknown as EngineeringResult
}
