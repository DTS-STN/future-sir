import { defineConfig } from '@hey-api/openapi-ts';

/**
 * @see https://heyapi.dev/openapi-ts/configuration
 */
export default defineConfig({
  input: 'other/specs/fsir-openapi.yml',
  output: {
    path: './app/.server/shared/api/interop',
    clean: true,
    indexFile: true,
    format: 'prettier',
    lint: 'eslint',
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './app/.server/shared/api/interop-client-config.ts',
    },
  ],
});
