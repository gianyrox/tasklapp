import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run our unit tests for pure logic; exclude e2e/browser concerns.
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
