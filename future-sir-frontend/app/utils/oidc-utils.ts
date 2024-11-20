import type { AuthorizationServer, Client, ClientAuth, IDToken } from 'oauth4webapi';
import {
  allowInsecureRequests,
  authorizationCodeGrantRequest,
  calculatePKCECodeChallenge,
  ClientSecretPost,
  discoveryRequest,
  generateRandomCodeVerifier,
  generateRandomNonce,
  generateRandomState,
  getValidatedIdTokenClaims,
  processAuthorizationCodeResponse,
  processDiscoveryResponse,
  validateAuthResponse,
} from 'oauth4webapi';

import { getLogger } from '~/.server/express/logging';

/**
 * Represents a sign-in request object containing the authorization URL, code verifier, and state.
 */
export type SignInRequest = {
  readonly authorizationEndpointUrl: URL;
  readonly codeVerifier: string;
  readonly nonce: string;
  readonly state: string;
};

/**
 * Represents a token set containing access token and optional id token and id token claims.
 */
export type TokenSet = {
  readonly accessToken: string;
  readonly idToken?: string;
  readonly idTokenClaims?: IDToken;
};

/**
 * Defines the interface for an authentication strategy.
 */
export interface AuthenticationStrategy {
  /**
   * Generates a sign-in request with the specified scopes.
   *
   * @param scopes - The requested scopes (defaults to `['openid']`).
   * @returns A promise resolving to a `SignInRequest` object.
   */
  generateSigninRequest(scopes?: string[]): Promise<SignInRequest>;

  /**
   * Exchanges an authorization code for tokens.
   *
   * @param parameters - The URL parameters from the callback.
   * @param expectedNonce - The expected nonce value.
   * @param expectedState - The expected state value.
   * @param codeVerifier - The PKCE code verifier.
   * @returns A promise resolving to the token endpoint response.
   */
  exchangeAuthCode(
    parameters: URLSearchParams,
    expectedNonce: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<TokenSet>;
}

/**
 * Abstract base class for OAuth authentication strategies.
 */
abstract class BaseAuthenticationStrategy implements AuthenticationStrategy {
  protected readonly log = getLogger('BaseAuthenticationStrategy');

  protected readonly allowInsecure: boolean;
  protected readonly authorizationServer: Promise<AuthorizationServer>;
  protected readonly callbackUrl: URL;
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  protected constructor(issuerUrl: URL, callbackUrl: URL, client: Client, clientAuth: ClientAuth, allowInsecure = false) {
    this.allowInsecure = allowInsecure;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.clientAuth = clientAuth;

    this.authorizationServer = new Promise((resolve) => {
      return discoveryRequest(issuerUrl, { [allowInsecureRequests]: this.allowInsecure }) //
        .then((response) => resolve(processDiscoveryResponse(issuerUrl, response)));
    });
  }

  public async generateSigninRequest(scopes: string[] = ['openid']): Promise<SignInRequest> {
    const { authorization_endpoint: authorizationEndpoint } = await this.authorizationServer;

    if (!authorizationEndpoint) {
      throw new Error('Authorization endpoint not found in the discovery document.');
    }

    const codeVerifier = generateRandomCodeVerifier();
    const nonce = generateRandomNonce();
    const state = generateRandomState();

    const authorizationEndpointUrl = new URL(authorizationEndpoint);
    authorizationEndpointUrl.searchParams.set('client_id', this.client.client_id);
    authorizationEndpointUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationEndpointUrl.searchParams.set('code_challenge', await calculatePKCECodeChallenge(codeVerifier));
    authorizationEndpointUrl.searchParams.set('nonce', nonce);
    authorizationEndpointUrl.searchParams.set('redirect_uri', this.callbackUrl.toString());
    authorizationEndpointUrl.searchParams.set('response_type', 'code');
    authorizationEndpointUrl.searchParams.set('scope', scopes.join(' '));
    authorizationEndpointUrl.searchParams.set('state', state);

    return { authorizationEndpointUrl, codeVerifier, nonce, state };
  }

  public async exchangeAuthCode(
    parameters: URLSearchParams,
    expectedNonce: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<TokenSet> {
    const authorizationServer = await this.authorizationServer;
    const callbackParameters = validateAuthResponse(authorizationServer, this.client, parameters, expectedState);

    const response = await authorizationCodeGrantRequest(
      authorizationServer,
      this.client,
      this.clientAuth,
      callbackParameters,
      this.callbackUrl.toString(),
      codeVerifier,
      { [allowInsecureRequests]: this.allowInsecure },
    );

    const tokenEndpointResponse = await processAuthorizationCodeResponse(authorizationServer, this.client, response, {
      expectedNonce,
    });

    const idTokenClaims = getValidatedIdTokenClaims(tokenEndpointResponse);

    return {
      accessToken: tokenEndpointResponse.access_token,
      idToken: tokenEndpointResponse.id_token,
      idTokenClaims: idTokenClaims,
    };
  }
}

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, { client_id: clientId }, ClientSecretPost(clientSecret));
  }
}

/**
 * Authentication strategy for a dev-only localhost provider.
 * This is a pretty typical authentication strategy, except all requests are allowed to be insecure.
 */
export class LocalAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, { client_id: clientId }, ClientSecretPost(clientSecret), true);
  }
}
