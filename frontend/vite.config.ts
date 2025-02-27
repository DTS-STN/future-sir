import { reactRouter } from '@react-router/dev/vite';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults } from 'vitest/config';

// important: this must be a non-aliased (ie: not ~/) import
import { preserveImportMetaUrl } from './vite.server.config';

/**
 * This file is used to build the application.
 * See vite.server.config.ts for the server build config.
 */
export default defineConfig({
  build: {
    target: 'es2022',
  },
  optimizeDeps: {
    entries: ['./app/entry.client.tsx', './app/root.tsx', './app/routes/**/*.tsx'],
  },
  plugins: [preserveImportMetaUrl(), tailwindcss(), tsconfigPaths(), framework()],
  server: {
    hmr: {
      // Configures the Hot Module Replacement (HMR) port.
      // Typically this would be set by the React Router server, but because
      // we use a custom express server, we have to manage this ourselves.
      // Leaving this blank equates to `random` which makes CSP more difficult.
      port: 3001,
    },
  },

  //
  // Vitest config. For more test configuration, see vitest.workspace.ts
  // see: https://vitest.dev/config/
  //
  test: {
    coverage: {
      // Includes only files within the `app` directory for test coverage reporting.
      include: ['**/app/**'],
      exclude: [
        '!**/app/[.]client/**', //
        '!**/app/[.]server/**',
        ...coverageConfigDefaults.exclude,
      ],
    },
    env: {
      // disable logging so we don't pollute the output
      LOG_LEVEL: 'none',
    },
    setupFiles: ['./tests/setup.ts'],
  },
});

/**
 * Determines which framework plugin to use.
 * Uses `@react-router/dev/vite` for development, and
 * @vitejs/plugin-react` for testing or other environments.
 *
 * see https://github.com/remix-run/remix/issues/9871
 */
function framework() {
  return process.env.NODE_ENV === 'test' ? react() : reactRouter();
}
