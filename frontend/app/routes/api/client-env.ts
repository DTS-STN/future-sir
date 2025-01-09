import type { Route } from './+types/client-env';

import { clientEnvironment, serverDefaults } from '~/.server/environment';

// we will aggressively cache the requested resource bundle for 1y
const CACHE_DURATION_SECS = 365 * 24 * 60 * 60;

/**
 * An endpoint that effectively generates a javascript file to be loaded by the client.
 * It sets the `globalThis.__appEnvironment` variable with the client environment,
 * handling caching headers based on the build revision.
 */
export function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const buildRevision = url.searchParams.get('v');

  // cache if the build revision is anything other than the default value
  const shouldCache = buildRevision !== serverDefaults.BUILD_REVISION;

  return new Response(`globalThis.__appEnvironment = ${JSON.stringify(clientEnvironment)}`, {
    headers: {
      'Content-Type': 'application/javascript',
      ...(shouldCache //
        ? { 'Cache-Control': `max-age=${CACHE_DURATION_SECS}, immutable` }
        : { 'Cache-Control': 'no-cache' }),
    },
  });
}
