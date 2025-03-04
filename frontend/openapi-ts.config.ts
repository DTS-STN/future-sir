import { defineConfig } from '@hey-api/openapi-ts';

/**
 * @see https://heyapi.dev/openapi-ts/configuration
 */
export default defineConfig({
  input: 'fsir-openapi.yml',
  output: {
    format: 'prettier',
    indexFile: true,
    path: 'app/.server/shared/api',
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './app/.server/shared/client-config.ts',
    },
  ],
});
