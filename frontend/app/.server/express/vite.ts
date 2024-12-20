import type { ViteDevServer } from 'vite';

import type { ServerEnvironment } from '~/.server/environment';

/**
 * Creates a Vite development server for non-production environments.
 * This function imports the Vite module and creates a new Vite server instance with middleware mode enabled.
 */
export async function createViteDevServer(environment: ServerEnvironment): Promise<ViteDevServer | undefined> {
  if (!environment.isProduction) {
    const vite = await import('vite');
    return await vite.createServer({
      server: { middlewareMode: true },
    });
  }
}
