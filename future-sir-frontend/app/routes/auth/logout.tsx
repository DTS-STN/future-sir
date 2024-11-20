import { SpanStatusCode, trace } from '@opentelemetry/api';

import type { Route } from './+types/logout';

const tracer = trace.getTracer('routes.auth.logout');

/**
 * Allows errors to be handled by root.tsx
 */
export default function Logout() {
  return <></>;
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  return handleLogout({ context, params, request });
}

function handleLogout({ context, params, request }: Route.LoaderArgs) {
  return tracer.startActiveSpan('routes.auth.logout.handle_logout', (span) => {
    try {
      const currentUrl = new URL(request.url);
      const returnTo = currentUrl.searchParams.get('returnto');

      span.setAttribute('request_url', currentUrl.toString());
      span.setAttribute('returnto', returnTo ?? 'not_provided');

      // clear the session authentication state
      // before checking the returnTo value to
      // ensure that the user is logged out even
      // when providing an invalid returnto value
      delete context.session.authState;

      if (returnTo && !returnTo.startsWith('/')) {
        span.addEvent('returnto.invalid');
        throw Response.json('Invalid returnto path', { status: 400 });
      }

      const returnUrl = new URL(returnTo ?? '/', currentUrl.origin);

      throw Response.redirect(returnUrl.toString());
    } catch (error) {
      if (!(error instanceof Response)) {
        span.recordException({
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      throw error;
    } finally {
      span.end();
    }
  });
}
