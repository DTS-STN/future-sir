import { redirect } from 'react-router';

import { trace } from '@opentelemetry/api';

import type { Route } from './+types/logout';

import { HttpStatusCodes } from '~/errors/http-status-codes';

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
  const span = trace.getActiveSpan();
  span?.updateName('routes.auth.logout.handle_logout');

  const currentUrl = new URL(request.url);
  const returnTo = currentUrl.searchParams.get('returnto');

  span?.setAttribute('request_url', currentUrl.toString());
  span?.setAttribute('returnto', returnTo ?? 'not_provided');

  // clear the session authentication state
  // before checking the returnTo value to
  // ensure that the user is logged out even
  // when providing an invalid returnto value
  delete context.session.authState;

  if (returnTo && !returnTo.startsWith('/')) {
    span?.addEvent('returnto.invalid');
    return Response.json('Invalid returnto path', { status: HttpStatusCodes.BAD_REQUEST });
  }

  const returnUrl = new URL(returnTo ?? '/', currentUrl.origin);
  return redirect(returnUrl.toString());
}
