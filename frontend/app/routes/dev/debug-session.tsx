import type { Route } from './+types/debug-session';

export function loader({ context }: Route.LoaderArgs) {
  return Response.json(context.session);
}
