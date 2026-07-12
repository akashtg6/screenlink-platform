import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    include: [
      'engineering-engine/**/*.test.ts',
      'commercial-engine/**/*.test.ts',
      'boq-engine/**/*.test.ts',
      'proposal-engine/**/*.test.ts',
      'excel-engine/**/*.test.ts',
      'features/workspace/canvas/tests/**/*.test.ts',
      'features/workspace/commands/tests/**/*.test.ts',
      'engines/workspace-engine/tests/**/*.test.ts',
    ],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: [
        'engineering-engine/**/*.ts',
        'commercial-engine/**/*.ts',
        'boq-engine/**/*.ts',
        'proposal-engine/**/*.ts',
        'lib/engineering/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/tests/**',
        '**/docs/**',
        '**/index.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
})
