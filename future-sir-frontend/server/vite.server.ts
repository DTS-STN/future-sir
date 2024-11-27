import type { ViteDevServer } from 'vite';

import type { Environment } from './environment.server';

/**
 * Creates a Vite development server for non-production environments.
 * This function imports the Vite module and creates a new Vite server instance with middleware mode enabled.
 *
 * @param environment The environment configuration.
 * @returns A promise that resolves to the Vite development server instance.
 */
export async function createViteDevServer(environment: Environment): Promise<ViteDevServer | undefined> {
  if (!environment.isProduction) {
    const vite = await import('vite');
    return await vite.createServer({
      server: { middlewareMode: true },
    });
  }
}
