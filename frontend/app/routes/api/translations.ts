import type { Route } from './+types/translations';

import { serverDefaults } from '~/.server/environment';
import { initI18next } from '~/i18n-config.server';

// we will aggressively cache the requested resource bundle for 1y
const CACHE_DURATION_SECS = 365 * 24 * 60 * 60;

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const language = url.searchParams.get('lng');
  const namespace = url.searchParams.get('ns');
  const buildRevision = url.searchParams.get('v');

  if (!language || !namespace) {
    return Response.json({ message: 'You must provide a language (lng) and namespace (ns)' }, { status: 400 });
  }

  const i18next = await initI18next();
  const resourceBundle = i18next.getResourceBundle(language, namespace);

  if (!resourceBundle) {
    return Response.json({ message: 'No resource bundle found for this language and namespace' }, { status: 404 });
  }

  // cache if the build revision is anything other than the default value
  const shouldCache = buildRevision !== serverDefaults.BUILD_REVISION;

  return Response.json(resourceBundle, {
    headers: shouldCache //
      ? { 'Cache-Control': `max-age=${CACHE_DURATION_SECS}, immutable` }
      : { 'Cache-Control': 'no-cache' },
  });
}
