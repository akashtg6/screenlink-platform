'use client'

import { useMemo } from 'react'
import { calculateEngineering } from '../core/calculate-engineering'
import type { ProjectData } from '../models/project-data'
import type { EngineeringResult } from '../models/engineering-result'

/**
 * MODULE 9 (4B) — React Hook that memoises engineering calculations for a
 * ProjectData input. Recalc only when a tracked field changes.
 *
 * NOTE: This is the ONLY React-touching file in the engine, isolated so the
 * rest of the engine can still be imported into workers, Node scripts, etc.
 */
export function useEngineering(input: ProjectData | null | undefined): EngineeringResult | null {
  return useMemo(() => {
    if (!input) return null
    return calculateEngineering(input)
  // Track only the primitive fields the engine consumes; deep-equality via JSON is acceptable
  // for our target dataset size (< 1 KB serialised input).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input && JSON.stringify(input)])
}
