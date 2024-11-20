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
  if (!session.codeVerifier || !session.state || !session.returnUrl) {
    return Response.json({ message: 'Invalid authentication session' }, { status: 400 });
  }

  const authenticationStrategy = new AzureAuthenticationStrategy(environment, new URL(currentUrl.origin));

  const { idToken, tokens } = await authenticationStrategy.exchangeAuthCode(
    currentUrl.searchParams,
    session.state,
    session.codeVerifier,
  );

  const returnUrl = session.returnUrl;

  session.idToken = idToken;
  session.tokens = tokens;
  delete session.codeVerifier;
  delete session.returnUrl;
  delete session.state;

  return Response.redirect(returnUrl.toString());
}
