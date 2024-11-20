import type { AppLoadContext } from 'react-router';

import { SpanStatusCode, trace } from '@opentelemetry/api';

import type { Route } from './+types/login';
import type { AuthenticationStrategy } from '~/utils/oidc-utils';
import { AzureAuthenticationStrategy, LocalAuthenticationStrategy } from '~/utils/oidc-utils';

const tracer = trace.getTracer('routes.auth.login');

/**
 * Allows errors to be handled by root.tsx
 */
export default function Login() {
  return <></>;
}

/**
 * Handles the authentication login for a given provider.
 * Will redirect to the default provider login handler if no provider is specified.
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const provider = params['*'];

  const currentUrl = new URL(request.url);
  const { environment, session } = context;

  switch (provider) {
    case '': {
      const redirectTo = `/auth/login/${environment.server.AUTH_DEFAULT_PROVIDER}${currentUrl.search}`;
      throw Response.redirect(new URL(redirectTo, currentUrl).toString());
    }

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

      return await handleLogin(authStrategy, currentUrl, session);
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

      return await handleLogin(authStrategy, currentUrl, session);
    }

    default: {
      throw Response.json({ message: 'Authentication provider not found' }, { status: 404 });
    }
  }
}

/**
 * Handles the login request for a given authentication strategy.
 * Generates a sign-in request and redirects the user to the authorization endpoint.
 */
async function handleLogin(authStrategy: AuthenticationStrategy, currentUrl: URL, session: AppLoadContext['session']) {
  return await tracer.startActiveSpan('routes.auth.login.handle_login', async (span) => {
    try {
      const returnTo = currentUrl.searchParams.get('returnto');

      span.setAttribute('request_url', currentUrl.toString());
      span.setAttribute('returnto', returnTo ?? 'not_provided');
      span.setAttribute('strategy', authStrategy.constructor.name);

      span.addEvent('signin_request.start');
      const signinRequest = await authStrategy.generateSigninRequest(['openid', 'profile', 'email']);
      span.addEvent('signin_request.success');

      if (returnTo && !returnTo.startsWith('/')) {
        span.addEvent('returnto.invalid');
        throw Response.json('Invalid returnto path', { status: 400 });
      }

      const returnUrl = returnTo ? new URL(returnTo, currentUrl.origin) : undefined;

      // store login state for processing in callback
      session.loginState = {
        codeVerifier: signinRequest.codeVerifier,
        nonce: signinRequest.nonce,
        returnUrl: returnUrl,
        state: signinRequest.state,
      };

      throw Response.redirect(signinRequest.authorizationEndpointUrl.toString(), 302);
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
