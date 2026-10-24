import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    exclude: [
      '**/node_modules/**',
      'src/rules/utils/**',
      'src/**',
    ],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        'src/plugin.ts',
        'src/rules/utils/**',
        'src/rulesLoader.ts',
        'src/interfaces/**'
      ],
      reportOnFailure: true,
    },
    reporters: [
      'default',
      ['junit', { outputFile: './junit.xml' }],
    ],
  },
})
