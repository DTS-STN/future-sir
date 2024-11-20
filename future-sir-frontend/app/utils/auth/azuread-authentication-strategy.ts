import { ClientSecretPost } from 'oauth4webapi';

import { BaseAuthenticationStrategy } from '~/utils/auth/authentication-strategy';

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureADAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, { client_id: clientId }, ClientSecretPost(clientSecret));
  }
}
