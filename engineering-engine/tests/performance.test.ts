import { describe, it, expect } from 'vitest'
import { calculateEngineering } from '../core/calculate-engineering'
import type { ProjectData } from '../models/project-data'

const TARGET_MS = 5

describe('Performance', () => {
  const input: ProjectData = {
    width: 6400, height: 3600, measurementUnit: 'mm', pixelPitchMm: 1.9,
  }

  it('single call completes in < 5 ms', () => {
    // Warm up JIT.
    for (let i = 0; i < 5; i++) calculateEngineering(input)

    const start = performance.now()
    const r = calculateEngineering(input)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(TARGET_MS)
    expect(r.calculationTimeMs).toBeLessThan(TARGET_MS)
  })

  it('sustains 1000 calls in reasonable time (< 200 ms total)', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      calculateEngineering({ ...input, width: 6400 + i })
    }
    const elapsed = performance.now() - start
    // 1000 calls with under 5ms each should easily fit under 200ms total.
    expect(elapsed).toBeLessThan(200)
    // Print for humans:
    // eslint-disable-next-line no-console
    console.log(`  → 1000 iterations: ${elapsed.toFixed(2)} ms (${(elapsed / 1000).toFixed(4)} ms/call)`)
  })
})
