import type { Route } from './+types/readyz';

/**
 * A basic readiness endpoint to be used by kubernetes container probes
 *
 * @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-readiness-probes
 */
export function loader({ context, params, request }: Route.LoaderArgs) {
  return Response.json({ ready: true });
}
