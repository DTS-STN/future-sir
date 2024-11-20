import type { Route } from './+types/buildinfo';

export function loader({ context }: Route.LoaderArgs) {
  const { BUILD_DATE, BUILD_ID, BUILD_REVISION, BUILD_VERSION } = context.environment.server;

  return Response.json({
    buildDate: BUILD_DATE,
    buildId: BUILD_ID,
    buildRevision: BUILD_REVISION,
    buildVersion: BUILD_VERSION,
  });
}
