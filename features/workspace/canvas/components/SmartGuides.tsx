'use client'

/**
 * Sprint 7 — Smart snap guides overlay.
 *
 * Reads `activeGuides` from the store and renders them as dashed lines with a
 * small "kind" label. Rendered inside the non-listening overlay layer of the
 * CanvasStage so guides never intercept clicks.
 */

import * as React from 'react'
import { Line, Text } from 'react-konva'
import { useWorkspaceStore } from '../store'

const GUIDE_COLOUR = {
  edge:    '#38bdf8', // cyan
  center:  '#c084fc', // purple
  spacing: '#f97316', // orange
  grid:    '#64748b',
} as const

export function SmartGuides() {
  const guides = useWorkspaceStore((s) => s.activeGuides)
  const scale  = useWorkspaceStore((s) => s.viewport.scale)

  if (guides.length === 0) return null

  return (
    <>
      {guides.map((g, idx) => {
        const colour = GUIDE_COLOUR[g.kind]
        // Extend guide a bit beyond the involved boxes so it visually punches.
        const pad = 60 / scale
        const from = g.from - pad
        const to   = g.to   + pad

        const points: number[] = g.orientation === 'V'
          ? [g.worldPos, from, g.worldPos, to]
          : [from, g.worldPos, to, g.worldPos]

        return (
          <React.Fragment key={`g-${idx}`}>
            <Line
              points={points}
              stroke={colour}
              strokeWidth={1 / scale}
              dash={[6 / scale, 4 / scale]}
              listening={false}
              perfectDrawEnabled={false}
              shadowColor={colour}
              shadowBlur={4 / scale}
              shadowOpacity={0.6}
            />
            {/* Small label near the guide midpoint. */}
            <Text
              x={g.orientation === 'V' ? g.worldPos + 4 / scale : (from + to) / 2}
              y={g.orientation === 'V' ? (from + to) / 2 : g.worldPos + 4 / scale}
              text={g.kind}
              fontFamily="ui-monospace, monospace"
              fontSize={10 / scale}
              fill={colour}
              opacity={0.9}
              listening={false}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
