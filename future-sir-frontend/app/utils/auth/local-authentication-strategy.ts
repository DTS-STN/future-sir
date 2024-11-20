import { ClientSecretPost } from 'oauth4webapi';

import { BaseAuthenticationStrategy } from '~/utils/auth/authentication-strategy';

/**
 * Authentication strategy for a dev-only localhost provider.
 * This is a pretty typical authentication strategy, except all requests are allowed to be insecure.
 */
export class LocalAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, { client_id: clientId }, ClientSecretPost(clientSecret), true);
  }
}
