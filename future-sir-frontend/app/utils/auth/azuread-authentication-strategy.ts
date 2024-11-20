import { trace } from '@opentelemetry/api';
import { ClientSecretPost } from 'oauth4webapi';

import { BaseAuthenticationStrategy } from '~/utils/auth/authentication-strategy';

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureADAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    const tracer = trace.getTracer('auth.strategy.azuread');
    super(issuerUrl, callbackUrl, { client_id: clientId }, ClientSecretPost(clientSecret), tracer);
  }
}
