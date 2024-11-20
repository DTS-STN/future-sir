import type { AppLoadContext } from 'react-router';

import type { Route } from './+types/login';
import type { AuthenticationStrategy } from '~/utils/oidc-utils';
import { AzureAuthenticationStrategy, LocalAuthenticationStrategy } from '~/utils/oidc-utils';

/**
 * Handles the authentication login for a given provider.
 * Will redirect to the default provider login handler if no provider is specified.
 */
export function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];

  const currentUrl = new URL(request.url);
  const { environment, session } = context;

  switch (provider) {
    case '': {
      const redirectTo = `/auth/login/${environment.server.AUTH_DEFAULT_PROVIDER}${currentUrl.search}`;
      throw Response.redirect(new URL(redirectTo, currentUrl).toString());
    }

    /**
     * When /auth/login/azuread is called, use an AzureAuthenticationStrategy to login.
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

      return handleLogin(authenticationStrategy, currentUrl, session);
    }

    /**
     * When /auth/login/local is called, use a LocalAuthenticationStrategy to login.
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

      return handleLogin(authenticationStrategy, currentUrl, session);
    }

    default: {
      throw Response.json({ message: 'Authentication provider not found' }, { status: 404 });
    }
  }
}

export default function Login() {
  return <></>; // allows errors to be handled by root.tsx
}

/**
 * Handles the login request for a given authentication strategy.
 * Generates a sign-in request and redirects the user to the authorization endpoint.
 */
async function handleLogin(
  authenticationStrategy: AuthenticationStrategy,
  currentUrl: URL,
  session: AppLoadContext['session'],
): Promise<void> {
  const returnTo = currentUrl.searchParams.get('returnto');

  if (returnTo && !returnTo.startsWith('/')) {
    throw Response.json('Invalid returnto path', { status: 400 });
  }

  const signinRequest = await authenticationStrategy.generateSigninRequest(['openid', 'profile', 'email']);
  const returnUrl = returnTo ? new URL(returnTo, currentUrl.origin) : undefined;

  // store login state for processing in callback
  session.codeVerifier = signinRequest.codeVerifier;
  session.returnUrl = returnUrl;
  session.state = signinRequest.state;

  throw Response.redirect(signinRequest.authorizationEndpointUrl.toString(), 302);
}
