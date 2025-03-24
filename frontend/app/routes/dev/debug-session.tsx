import type { Route } from './+types/debug-session';

import { getRouterContext } from '~/.server/router-context';

export function loader({ context }: Route.LoaderArgs) {
  const { session } = context.get(getRouterContext());
  return Response.json(session);
}
