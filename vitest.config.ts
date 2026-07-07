// vitest.config.ts
// Test runner config. Vitest reuses Vite, so no separate build setup.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',   // match the browser so escape/unescape behaves the same
    include: ['src/**/*.test.ts'],
  },
});