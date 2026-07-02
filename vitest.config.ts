import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['engineering-engine/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['engineering-engine/**/*.ts'],
      exclude: ['engineering-engine/**/*.test.ts', 'engineering-engine/tests/**', 'engineering-engine/docs/**', 'engineering-engine/index.ts'],
      reporter: ['text', 'text-summary'],
    },
  },
})
