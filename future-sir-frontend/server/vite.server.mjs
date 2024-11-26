/**
 * @typedef {ReturnType<import('./environment.server.mjs').getServerEnvironment>} ServerEnvironment
 * @typedef {import('vite').ViteDevServer} ViteDevServer
 */

/**
 * Creates a Vite development server for non-production environments.
 * This function imports the Vite module and creates a new Vite server instance with middleware mode enabled.
 *
 * @param {ServerEnvironment} serverEnvironment The environment configuration.
 * @returns {Promise<ViteDevServer | undefined>} A promise that resolves to the Vite development server instance.
 */
export async function createViteDevServer(serverEnvironment) {
  if (!serverEnvironment.isProduction) {
    const vite = await import('vite');
    return await vite.createServer({
      server: { middlewareMode: true },
    });
  }
}
