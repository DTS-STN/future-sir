import { defineWorkspace } from 'vitest/config';

/**
 * see: https://vitest.dev/guide/workspace
 */
export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: [
        '**/tests/components/**/*.test.(ts|tsx)',
        '**/tests/hooks/**/*.test.(ts|tsx)',
        '**/tests/routes/**/*.test.(ts|tsx)',
      ],
    },
  },
  {
    extends: './vite.config.ts',
    test: {
      name: 'node',
      environment: 'node',
      include: ['**/tests/**/*.test.(ts|tsx)'],
      exclude: ['**/tests/components/**', '**/tests/hooks/**', '**/tests/routes/**'],
    },
  },
]);
