import type { AppLoadContext } from 'react-router';
import { redirect } from 'react-router';

import { Redacted } from 'effect';

import type { Route } from './+types/callback';
import { serverEnvironment } from '~/.server/environment';
import type { AuthenticationStrategy } from '~/utils/auth/authentication-strategy';
import { AzureADAuthenticationStrategy } from '~/utils/auth/azuread-authentication-strategy';
import { LocalAuthenticationStrategy } from '~/utils/auth/local-authentication-strategy';
import { withSpan } from '~/utils/instrumentation-utils';

/**
 * Allows errors to be handled by root.tsx
 */
export default function Callback() {
  return <></>;
}

/**
 * Handles the authentication callback for a given provider.
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];

  const currentUrl = new URL(request.url);
  const { session } = context;

  switch (provider) {
    case 'azuread': {
      const { AZUREAD_ISSUER_URL, AZUREAD_CLIENT_ID } = serverEnvironment;
      const AZUREAD_CLIENT_SECRET = Redacted.value(serverEnvironment.AZUREAD_CLIENT_SECRET);

      if (!AZUREAD_ISSUER_URL || !AZUREAD_CLIENT_ID || !AZUREAD_CLIENT_SECRET) {
        throw new Error('The Azure OIDC settings are misconfigured');
      }

      const authStrategy = new AzureADAuthenticationStrategy(
        new URL(AZUREAD_ISSUER_URL),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        AZUREAD_CLIENT_ID,
        AZUREAD_CLIENT_SECRET,
      );

      return await handleCallback(authStrategy, currentUrl, session);
    }

    case 'local': {
      const { ENABLE_DEVMODE_OIDC } = serverEnvironment;

      if (!ENABLE_DEVMODE_OIDC) {
        return Response.json(null, { status: 404 });
      }

      const authStrategy = new LocalAuthenticationStrategy(
        new URL('/auth/oidc', currentUrl.origin),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
      );

      return await handleCallback(authStrategy, currentUrl, session);
    }

    default: {
      return Response.json('Authentication provider not found', { status: 404 });
    }
  }
}

/**
 * Handles the callback request for a given authentication strategy.
 * Exchanges the authorization code for an access token and ID token.
 */
async function handleCallback(authStrategy: AuthenticationStrategy, currentUrl: URL, session: AppLoadContext['session']) {
  return withSpan('routes.auth.callback.handle_callback', async (span) => {
    span.setAttribute('request_url', currentUrl.toString());
    span.setAttribute('strategy', authStrategy.name);

    if (session.loginState === undefined) {
      span.addEvent('login_state.invalid');
      return Response.json({ message: 'Invalid login state' }, { status: 400 });
    }

    const { codeVerifier, nonce, state } = session.loginState;

    span.addEvent('token_exchange.start');
    const tokenSet = await authStrategy.exchangeAuthCode(currentUrl.searchParams, nonce, state, codeVerifier);
    span.addEvent('token_exchange.success');

    const returnUrl = new URL(session.loginState.returnUrl ?? '/', currentUrl.origin);
    span.setAttribute('return_url', returnUrl.toString());

    delete session.loginState;

    session.authState = {
      accessToken: tokenSet.accessToken,
      idToken: tokenSet.idToken,
      idTokenClaims: tokenSet.idTokenClaims,
    };

    return redirect(returnUrl.toString());
  });
}
