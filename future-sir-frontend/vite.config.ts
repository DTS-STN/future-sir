import { reactRouter } from '@react-router/dev/vite';

import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * This file is used to build the application.
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
  plugins: [
    // Integrates TypeScript path aliasing using the `vite-tsconfig-paths` plugin,
    // which resolves paths defined in `tsconfig.json` for cleaner imports.
    tsconfigPaths(),
    framework(),
  ],
  server: {
    hmr: {
      // Configures the Hot Module Replacement (HMR) port.
      // Typically this would be set by the React Router server, but because
      // we use a custom express server, we have to manage this ourselves.
      // Leaving this blank equates to `random` which makes CSP more difficult.
      port: 3001,
    },
  },
  test: {
    coverage: {
      // Includes only files within the `app` directory for test coverage reporting.
      include: ['**/app/**'],
    },
    environmentMatchGlobs: [
      // Maps specific test paths to test environments.
      // Example: Components, hooks, and routes tests run in a `jsdom` environment to simulate a browser-like context.
      ['**/tests/components/**', 'jsdom'],
      ['**/tests/hooks/**', 'jsdom'],
      ['**/tests/routes/**', 'jsdom'],
    ],

    // Specifies the file patterns to include as tests.
    include: ['**/tests/**/*.test.(ts|tsx)'],

    // Setup files to initialize the testing environment (global setup, mocks, etc).
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
