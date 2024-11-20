import type { AuthorizationServer, Client, ClientAuth, DiscoveryRequestOptions, IDToken } from 'oauth4webapi';
import {
  allowInsecureRequests,
  authorizationCodeGrantRequest,
  calculatePKCECodeChallenge,
  ClientSecretPost,
  discoveryRequest,
  generateRandomCodeVerifier,
  generateRandomState,
  getValidatedIdTokenClaims,
  processAuthorizationCodeResponse,
  processDiscoveryResponse,
  validateAuthResponse,
} from 'oauth4webapi';

/**
 * Represents a sign-in request object containing the authorization URL, code verifier, and state.
 */
export type SignInRequest = {
  authorizationEndpointUrl: URL;
  codeVerifier: string;
  state: string;
};

/**
 * Represents a token set containing access token and optional id token and id token claims.
 */
export type TokenSet = {
  accessToken: string;
  idToken?: string;
  idTokenClaims?: IDToken;
};

/**
 * Represents an error that occurs during authentication.
 */
export class AuthenticationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Represents an error during discovery.
 */
export class DiscoveryError extends AuthenticationError {
  constructor(message: string) {
    super('DISCOVERY_FAILED', message);
    this.name = 'DiscoveryError';
  }
}

/**
 * Represents an error during token exchange.
 */
export class TokenExchangeError extends AuthenticationError {
  constructor(message: string) {
    super('TOKEN_EXCHANGE_FAILED', message);
    this.name = 'TokenExchangeError';
  }
}

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
   * @param expectedState - The expected state value.
   * @param codeVerifier - The PKCE code verifier.
   * @returns A promise resolving to the token endpoint response.
   *
   * @throws {AuthenticationError} If token exchange fails.
   */
  exchangeAuthCode(parameters: URLSearchParams, expectedState: string, codeVerifier: string): Promise<TokenSet>;
}

/**
 * Abstract base class for OAuth authentication strategies.
 */
abstract class BaseAuthenticationStrategy implements AuthenticationStrategy {
  protected readonly allowInsecure: boolean;
  protected readonly authorizationServer: Promise<AuthorizationServer>;
  protected readonly callbackUrl: URL;
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  protected constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string, allowInsecure = false) {
    this.allowInsecure = allowInsecure;
    this.authorizationServer = this.initAuthorizationServer(issuerUrl, { [allowInsecureRequests]: allowInsecure });
    this.callbackUrl = callbackUrl;
    this.client = { client_id: clientId };
    this.clientAuth = ClientSecretPost(clientSecret);
  }

  public async generateSigninRequest(scopes: string[] = ['openid']): Promise<SignInRequest> {
    const codeVerifier = generateRandomCodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = generateRandomState();

    const authorizationServer = await this.authorizationServer;
    const authorizationEndpoint = authorizationServer.authorization_endpoint;

    if (!authorizationEndpoint) {
      throw new DiscoveryError('Authorization endpoint not found in the discovery document.');
    }

    const authorizationEndpointUrl = new URL(authorizationEndpoint);
    authorizationEndpointUrl.searchParams.set('client_id', this.client.client_id);
    authorizationEndpointUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationEndpointUrl.searchParams.set('code_challenge', codeChallenge);
    authorizationEndpointUrl.searchParams.set('redirect_uri', this.callbackUrl.toString());
    authorizationEndpointUrl.searchParams.set('response_type', 'code');
    authorizationEndpointUrl.searchParams.set('scope', scopes.join(' '));
    authorizationEndpointUrl.searchParams.set('state', state);

    return { authorizationEndpointUrl, codeVerifier, state };
  }

  public async exchangeAuthCode(parameters: URLSearchParams, expectedState: string, codeVerifier: string): Promise<TokenSet> {
    try {
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

      const tokenEndpointResponse = await processAuthorizationCodeResponse(authorizationServer, this.client, response);
      const idTokenClaims = getValidatedIdTokenClaims(tokenEndpointResponse);

      return {
        accessToken: tokenEndpointResponse.access_token,
        idToken: tokenEndpointResponse.id_token,
        idTokenClaims: idTokenClaims,
      };
    } catch (error) {
      throw new TokenExchangeError(error instanceof Error ? error.message : 'Unknown error during token exchange');
    }
  }

  private async initAuthorizationServer(issuerUrl: URL, options?: DiscoveryRequestOptions): Promise<AuthorizationServer> {
    try {
      const response = await discoveryRequest(issuerUrl, options);
      return await processDiscoveryResponse(issuerUrl, response);
    } catch (error) {
      throw new DiscoveryError(error instanceof Error ? error.message : 'Failed to discover authorization server');
    }
  }
}

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, clientId, clientSecret);
  }
}

/**
 * Authentication strategy for a dev-only localhost provider.
 */
export class LocalAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super(issuerUrl, callbackUrl, clientId, clientSecret, true);
  }
}
