import type { Route } from './+types/translations';
import { serverDefaults } from '~/.server/environment';
import { initI18next } from '~/i18n-config.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const lng = url.searchParams.get('lng');
  const ns = url.searchParams.get('ns');
  const buildRevision = url.searchParams.get('v');

  if (!lng || !ns) {
    throw Response.json({ message: 'You must provide a language (lng) and namespace (ns)' }, { status: 400 });
  }

  const i18next = await initI18next();
  const resourceBundle = i18next.getResourceBundle(lng, ns);

  if (!resourceBundle) {
    throw Response.json({ message: 'No resource bundle found for this language and namespace' }, { status: 404 });
  }

  const headers =
    // tell the browser to aggressively cache the bundle for 1y (or don't)
    buildRevision && buildRevision !== serverDefaults.DEFAULT_BUILD_REVISION //
      ? { 'Cache-Control': 'max-age=31536000, immutable' }
      : undefined;

  return Response.json(resourceBundle, { headers });
}
