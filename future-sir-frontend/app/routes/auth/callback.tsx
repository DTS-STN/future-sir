import type { AppLoadContext } from 'react-router';

import type { Route } from './+types/callback';
import type { AuthenticationStrategy } from '~/utils/oidc-utils';
import { AzureAuthenticationStrategy, LocalAuthenticationStrategy } from '~/utils/oidc-utils';

/**
 * Handles the authentication callback for a given provider.
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];

  const currentUrl = new URL(request.url);
  const { environment, session } = context;

  switch (provider) {
    /**
     * When /auth/callback/azuread is called, use an AzureAuthenticationStrategy to perform a token exchange.
     */
    case 'azuread': {
      const { AZUREAD_ISSUER_URL, AZUREAD_CLIENT_ID, AZUREAD_CLIENT_SECRET } = environment.server;

      if (!AZUREAD_ISSUER_URL || !AZUREAD_CLIENT_ID || !AZUREAD_CLIENT_SECRET) {
        throw new Error('The Azure OIDC settings are misconfigured');
      }

      const authenticationStrategy = new AzureAuthenticationStrategy(
        new URL(AZUREAD_ISSUER_URL),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        AZUREAD_CLIENT_ID,
        AZUREAD_CLIENT_SECRET,
      );

      return await handleCallback(authenticationStrategy, currentUrl, session);
    }

    /**
     * When /auth/callback/local is called, use a LocalAuthenticationStrategy to perform a token exchange.
     */
    case 'local': {
      const { ENABLE_DEVMODE_OIDC, PORT } = context.environment.server;

      if (!ENABLE_DEVMODE_OIDC) {
        throw Response.json(null, { status: 404 });
      }

      const authenticationStrategy = new LocalAuthenticationStrategy(
        new URL(`http://localhost:${PORT}/auth/oidc`),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
      );

      return await handleCallback(authenticationStrategy, currentUrl, session);
    }

    default: {
      throw Response.json('Authentication provider not found', { status: 404 });
    }
  }
}

export default function Callback() {
  return <></>; // allows errors to be handled by root.tsx
}

/**
 * Handles the callback request for a given authentication strategy.
 * Exchanges the authorization code for an access token and ID token.
 */
async function handleCallback(
  authenticationStrategy: AuthenticationStrategy,
  currentUrl: URL,
  session: AppLoadContext['session'],
) {
  const { codeVerifier, state } = session;

  if (!codeVerifier || !state) {
    throw Response.json({ message: 'Invalid authentication session' }, { status: 400 });
  }

  const tokenSet = await authenticationStrategy.exchangeAuthCode(currentUrl.searchParams, state, codeVerifier);

  session.accessToken = tokenSet.accessToken;
  session.idToken = tokenSet.idToken;
  session.idTokenClaims = tokenSet.idTokenClaims;

  const returnUrl = new URL(session.returnUrl ?? '/', currentUrl.origin);
  delete session.codeVerifier;
  delete session.returnUrl;
  delete session.state;

  throw Response.redirect(returnUrl.toString());
}
