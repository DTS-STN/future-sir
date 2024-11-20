import type { AppLoadContext } from 'react-router';
import { redirect } from 'react-router';

import type { Route } from './+types/login';
import { AzureAuthenticationStrategy } from '~/utils';

// TODO :: GjB :: make this a configuration option
const DEFAULT_PROVIDER = 'azure';

export function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];
  const currentUrl = new URL(request.url);

  if (!provider) {
    const redirectUrl = new URL(`/auth/login/${DEFAULT_PROVIDER}${currentUrl.search}`, currentUrl);
    throw redirect(redirectUrl.toString());
  }

  switch (provider) {
    case 'azure': {
      return handleAzureLogin(currentUrl, context.environment.server, context.session);
    }

    default: {
      return Response.json({ message: 'Authentication provider not found' }, { status: 404 });
    }
  }
}

async function handleAzureLogin(
  currentUrl: URL,
  environment: AppLoadContext['environment']['server'],
  session: AppLoadContext['session'],
) {
  const { AZURE_ISSUER_URL, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = environment;

  if (!AZURE_ISSUER_URL || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error('The Azure OIDC settings are misconfigured');
  }

  const authenticationStrategy = new AzureAuthenticationStrategy(
    new URL(AZURE_ISSUER_URL),
    new URL('/auth/callback/azure', currentUrl.origin),
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
  );

  const returnTo = currentUrl.searchParams.get('returnto');

  if (returnTo && !returnTo.startsWith('/')) {
    return Response.json('Invalid returnto path', { status: 400 });
  }

  const { authorizationEndpointUrl, codeVerifier, state } = await authenticationStrategy.generateSigninRequest();
  const returnUrl = returnTo ? new URL(returnTo, currentUrl.origin) : undefined;

  // store login state for processing in callback
  session.codeVerifier = codeVerifier;
  session.returnUrl = returnUrl;
  session.state = state;

  return redirect(authorizationEndpointUrl.toString(), 302);
}
