import { reactRouter } from '@react-router/dev/vite';

import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// important: this must be a non-aliased (ie: not ~/) import
import { preserveImportMetaUrl } from './vite.server.config';

/**
 * This file is used to build the application.
 * See vite.server.config.ts for the server build config.
 */
export default defineConfig({
  css: {
    postcss: {
      // Configures PostCSS with Tailwind CSS and Autoprefixer.
      // Tailwind CSS is used for utility-based styling, and Autoprefixer ensures styles work across browsers.
      plugins: [tailwindcss, autoprefixer],
    },
  },
  optimizeDeps: {
    entries: ['./app/entry.client.tsx', './app/root.tsx', './app/routes/**/*.tsx'],
  },
  plugins: [preserveImportMetaUrl(), tsconfigPaths(), framework()],
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
