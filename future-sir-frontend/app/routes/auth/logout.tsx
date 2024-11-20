import type { Route } from './+types/logout';

export function loader({ context, params, request }: Route.LoaderArgs) {
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
}
