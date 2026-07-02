import type { ProjectData } from '../models/project-data'
import type { EngineeringResult, EngineeringMessage } from '../models/engineering-result'

export type RuleSeverity = 'info' | 'warning' | 'critical'
export type RuleCategory = 'display' | 'viewing' | 'installation' | 'power' | 'maintainability' | 'content'

export interface RecommendationHint {
  field?: string
  suggested: string | number | boolean
  confidence: number    // 0-1
}

export interface EngineeringRule {
  id: string                   // e.g. 'PITCH_TOO_COARSE_FOR_TEXT'
  description: string
  category: RuleCategory
  severity: RuleSeverity
  when: (input: ProjectData, ctx: EngineeringResult) => boolean
  message: (input: ProjectData, ctx: EngineeringResult) => string
  suggestion?: (input: ProjectData, ctx: EngineeringResult) => string
  recommendation?: (input: ProjectData, ctx: EngineeringResult) => RecommendationHint | undefined
  explanation: string
}

export interface RuleFinding {
  ruleId: string
  category: RuleCategory
  severity: RuleSeverity
  message: string
  suggestion?: string
  explanation: string
  recommendation?: RecommendationHint
}

/**
 * MODULE 5 (4B) — Engineering Rules Engine.
 * Applies a configurable, side-effect-free rule set against ProjectData +
 * previously computed EngineeringResult context and returns findings.
 *
 * Rules are data — not code inside components.
 *
 * @pure
 */
export function evaluateRules(input: ProjectData, ctx: EngineeringResult, rules: EngineeringRule[]): RuleFinding[] {
  const findings: RuleFinding[] = []
  for (const rule of rules) {
    try {
      if (rule.when(input, ctx)) {
        findings.push({
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          message: rule.message(input, ctx),
          suggestion: rule.suggestion?.(input, ctx),
          explanation: rule.explanation,
          recommendation: rule.recommendation?.(input, ctx),
        })
      }
    } catch {
      // A rule failing shouldn't crash the engine.
    }
  }
  return findings
}

/** Convert rule findings to top-level EngineeringMessage[] for the result. */
export function findingsToMessages(findings: RuleFinding[]): EngineeringMessage[] {
  return findings.map((f) => ({
    code: f.ruleId,
    field: f.recommendation?.field,
    severity: (f.severity === 'critical' ? 'error' : f.severity) as EngineeringMessage['severity'],
    message: f.message,
    suggestion: f.suggestion,
  }))
}
