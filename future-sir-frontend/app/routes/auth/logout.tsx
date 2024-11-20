import { trace } from '@opentelemetry/api';

import type { Route } from './+types/logout';

/**
 * Allows errors to be handled by root.tsx
 */
export default function Logout() {
  return <></>;
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tracer = trace.getTracer('routes.auth.logout');

  return tracer.startActiveSpan('routes.auth.logout.loader', (span) => {
    try {
      const currentUrl = new URL(request.url);
      const returnTo = currentUrl.searchParams.get('returnto');

      context.session.accessToken = undefined;
      context.session.idToken = undefined;
      context.session.idTokenClaims = undefined;

      if (returnTo && !returnTo.startsWith('/')) {
        throw Response.redirect('/');
      }

      const returnUrl = new URL(returnTo ?? '/', currentUrl.origin);
      throw Response.redirect(returnUrl.toString());
    } finally {
      span.end();
    }
  });
}
