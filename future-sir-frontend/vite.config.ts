import { reactRouter } from '@react-router/dev/vite';

import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

function framework() {
  return process.env.NODE_ENV === 'test' ? react() : reactRouter();
}

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [framework(), tsconfigPaths()],
  test: {
    coverage: {
      include: ['**/app/**'],
    },
    environmentMatchGlobs: [
      ['**/tests/components/**', 'jsdom'],
      ['**/tests/hooks/**', 'jsdom'],
      ['**/tests/routes/**', 'jsdom'],
    ],
    include: ['**/tests/**/*.test.(ts|tsx)'],
    setupFiles: ['./tests/setup.ts'],
  },
});
