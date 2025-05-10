import type { Route } from './+types/translations';

import { serverDefaults } from '~/.server/environment';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { initI18next } from '~/i18n-config.server';

// we will aggressively cache the requested resource bundle for 1y
const CACHE_DURATION_SECS = 365 * 24 * 60 * 60;

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const language = url.searchParams.get('lng');
  const namespace = url.searchParams.get('ns');

  if (!language || !namespace) {
    return Response.json(
      { message: 'You must provide a language (lng) and namespace (ns)' },
      { status: HttpStatusCodes.BAD_REQUEST },
    );
  }

  const i18next = await initI18next();
  const resourceBundle = i18next.getResourceBundle(language, namespace);

  if (!resourceBundle) {
    return Response.json(
      { message: 'No resource bundle found for this language and namespace' },
      { status: HttpStatusCodes.NOT_FOUND },
    );
  }

  // cache if the requested revision is anything other
  // than the default build revision used during development
  const revision = url.searchParams.get('v') ?? serverDefaults.BUILD_REVISION;
  const shouldCache = revision !== serverDefaults.BUILD_REVISION;

  return Response.json(resourceBundle, {
    headers: shouldCache //
      ? { 'Cache-Control': `max-age=${CACHE_DURATION_SECS}, immutable` }
      : { 'Cache-Control': 'no-cache' },
  });
}
