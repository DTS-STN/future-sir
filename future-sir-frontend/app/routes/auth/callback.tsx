import type { AppLoadContext } from 'react-router';

import { SpanStatusCode, trace } from '@opentelemetry/api';

import type { Route } from './+types/callback';
import type { AuthenticationStrategy } from '~/utils/oidc-utils';
import { AzureAuthenticationStrategy, LocalAuthenticationStrategy } from '~/utils/oidc-utils';

const tracer = trace.getTracer('routes.auth.callback');

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
  const { environment, session } = context;

  switch (provider) {
    case 'azuread': {
      const { AZUREAD_ISSUER_URL, AZUREAD_CLIENT_ID, AZUREAD_CLIENT_SECRET } = environment.server;

      if (!AZUREAD_ISSUER_URL || !AZUREAD_CLIENT_ID || !AZUREAD_CLIENT_SECRET) {
        throw new Error('The Azure OIDC settings are misconfigured');
      }

      const authStrategy = new AzureAuthenticationStrategy(
        new URL(AZUREAD_ISSUER_URL),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        AZUREAD_CLIENT_ID,
        AZUREAD_CLIENT_SECRET,
      );

      return await handleCallback(authStrategy, currentUrl, session);
    }

    case 'local': {
      const { ENABLE_DEVMODE_OIDC, PORT } = environment.server;

      if (!ENABLE_DEVMODE_OIDC) {
        throw Response.json(null, { status: 404 });
      }

      const authStrategy = new LocalAuthenticationStrategy(
        new URL(`http://localhost:${PORT}/auth/oidc`),
        new URL(`/auth/callback/${provider}`, currentUrl.origin),
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
      );

      return await handleCallback(authStrategy, currentUrl, session);
    }

    default: {
      throw Response.json('Authentication provider not found', { status: 404 });
    }
  }
}

/**
 * Handles the callback request for a given authentication strategy.
 * Exchanges the authorization code for an access token and ID token.
 */
async function handleCallback(authStrategy: AuthenticationStrategy, currentUrl: URL, session: AppLoadContext['session']) {
  return await tracer.startActiveSpan('routes.auth.callback.handle_callback', async (span) => {
    span.setAttribute('request_url', currentUrl.toString());
    span.setAttribute('strategy', authStrategy.constructor.name);

    try {
      if (session.loginState === undefined) {
        span.addEvent('login_state.invalid');
        throw Response.json({ message: 'Invalid login state' }, { status: 400 });
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
