import type { ProjectData } from '../models/project-data'
import type { EngineeringResult } from '../models/engineering-result'
import type { RuleFinding } from '../rules/rules-engine'

export interface EngineeringScore {
  overall: number                       // 0-100
  categories: {
    displayDesign: number
    viewingExperience: number
    powerEfficiency: number
    installationEfficiency: number
    maintainability: number
  }
  deductions: { category: keyof EngineeringScore['categories']; ruleId: string; points: number; reason: string }[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

const CATEGORY_MAP: Record<string, keyof EngineeringScore['categories']> = {
  display: 'displayDesign',
  viewing: 'viewingExperience',
  power: 'powerEfficiency',
  installation: 'installationEfficiency',
  maintainability: 'maintainability',
  content: 'displayDesign',
}

/**
 * MODULE 7 (4B) — Engineering Score (0–100).
 * Starts every category at 100 and deducts points per finding severity.
 *
 * @pure
 */
export function computeEngineeringScore(_input: ProjectData, ctx: EngineeringResult, findings: RuleFinding[]): EngineeringScore {
  const cats = { displayDesign: 100, viewingExperience: 100, powerEfficiency: 100, installationEfficiency: 100, maintainability: 100 }
  const deductions: EngineeringScore['deductions'] = []

  for (const f of findings) {
    const cat = CATEGORY_MAP[f.category] ?? 'displayDesign'
    const points = f.severity === 'critical' ? 25 : f.severity === 'warning' ? 12 : 4
    cats[cat] = Math.max(0, cats[cat] - points)
    deductions.push({ category: cat, ruleId: f.ruleId, points, reason: f.message })
  }

  // Bonus/penalty on installation from cabinet efficiency
  if (ctx.cabinet) {
    const eff = ctx.cabinet.efficiencyPercent
    if (eff < 90) {
      const pts = Math.round((95 - eff) * 0.6)
      cats.installationEfficiency = Math.max(0, cats.installationEfficiency - pts)
      deductions.push({ category: 'installationEfficiency', ruleId: 'CABINET_EFFICIENCY', points: pts, reason: `Cabinet efficiency only ${eff}%.` })
    }
  }

  // Viewing comfort feeds directly
  if (ctx.viewing && ctx.viewing.comfortScore < 100) {
    const pts = Math.round((100 - ctx.viewing.comfortScore) * 0.6)
    cats.viewingExperience = Math.max(0, Math.min(cats.viewingExperience, 100 - pts))
  }

  const overall = Math.round(
    (cats.displayDesign * 0.30) +
    (cats.viewingExperience * 0.25) +
    (cats.installationEfficiency * 0.20) +
    (cats.powerEfficiency * 0.15) +
    (cats.maintainability * 0.10),
  )

  return {
    overall,
    categories: cats,
    deductions,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
  }
}
