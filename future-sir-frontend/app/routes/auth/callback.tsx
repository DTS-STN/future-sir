import type { AppLoadContext } from 'react-router';

import type { Route } from './+types/callback';
import { AzureAuthenticationStrategy } from '~/utils';

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];

  switch (provider) {
    case 'azure': {
      return await handleAzureCallback(new URL(request.url), context.environment.server, context.session);
    }

    default: {
      return Response.json('Authentication provider not found', { status: 404 });
    }
  }
}

async function handleAzureCallback(
  currentUrl: URL,
  environment: AppLoadContext['environment']['server'],
  session: AppLoadContext['session'],
) {
  const { AZURE_ISSUER_URL, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = environment;
  const { codeVerifier, state } = session;

  if (!codeVerifier || !state) {
    return Response.json({ message: 'Invalid authentication session' }, { status: 400 });
  }

  if (!AZURE_ISSUER_URL || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error('The Azure OIDC settings are misconfigured');
  }

  const authenticationStrategy = new AzureAuthenticationStrategy(
    new URL(AZURE_ISSUER_URL),
    new URL('/auth/callback/azure', currentUrl.origin),
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
  );

  const { idToken, tokens } = await authenticationStrategy.exchangeAuthCode(currentUrl.searchParams, state, codeVerifier);

  const returnUrl = new URL(session.returnUrl ?? '/', currentUrl.origin);

  session.idToken = idToken;
  session.tokens = tokens;
  delete session.codeVerifier;
  delete session.returnUrl;
  delete session.state;

  return Response.redirect(returnUrl.toString());
}
