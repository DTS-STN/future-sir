import type { Route } from './+types/client-env';
import { clientEnvironment, serverDefaults } from '~/.server/environment';

/**
 * An endpoint that effectively generates a javascript file to be loaded by the client.
 * It sets the `globalThis.__appEnvironment` variable with the client environment,
 * handling caching headers based on the build revision.
 */
export function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const buildRevision = url.searchParams.get('v');

  const headers =
    // tell the browser to aggressively cache the bundle for 1y (or don't)
    buildRevision && buildRevision !== serverDefaults.DEFAULT_BUILD_REVISION //
      ? { 'Cache-Control': 'max-age=31536000, immutable' }
      : undefined;

  return new Response(`globalThis.__appEnvironment = ${JSON.stringify(clientEnvironment)}`, {
    headers: { ...headers, 'Content-Type': 'application/javascript' },
  });
}
