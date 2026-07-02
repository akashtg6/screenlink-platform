import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    include: ['engineering-engine/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['engineering-engine/**/*.ts', 'lib/engineering/**/*.ts'],
      exclude: ['engineering-engine/**/*.test.ts', 'engineering-engine/tests/**', 'engineering-engine/docs/**', 'engineering-engine/index.ts'],
      reporter: ['text', 'text-summary'],
    },
  },
})
