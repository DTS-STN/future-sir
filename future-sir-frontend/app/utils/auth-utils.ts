import type { AuthorizationServer, Client, ClientAuth, IDToken, TokenEndpointResponse } from 'oauth4webapi';
import {
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
 * Represents an error that occurs during authentication.
 */
export class AuthenticationError extends Error {
  constructor(
    readonly message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Defines the interface for an authentication strategy.
 */
export interface AuthenticationStrategy {
  /**
   * Gets the callback URL used for this strategy.
   */
  getCallbackUrl(): URL;

  /**
   * Generates a sign-in request with the specified scopes.
   *
   * @param scopes - The requested scopes (defaults to `['openid', 'email' ,'profile']`).
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
  exchangeAuthCode(
    parameters: URLSearchParams,
    expectedState: string,
    codeVerifier: string,
    origin: string,
  ): Promise<{ idToken: IDToken; tokens: TokenEndpointResponse }>;
}

/**
 * Abstract base class for OAuth authentication strategies.
 */
abstract class BaseAuthenticationStrategy implements AuthenticationStrategy {
  protected readonly authorizationServer: Promise<AuthorizationServer>;
  protected readonly callbackUrl: URL;
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    this.authorizationServer = this.discoverAuthorizationServer(issuerUrl);
    this.callbackUrl = callbackUrl;
    this.client = { client_id: clientId };
    this.clientAuth = ClientSecretPost(clientSecret);
  }

  public getCallbackUrl(): URL {
    return this.callbackUrl;
  }

  public async generateSigninRequest(scopes: string[] = ['openid', 'email', 'profile']): Promise<SignInRequest> {
    const codeVerifier = generateRandomCodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = generateRandomState();

    const authorizationServer = await this.authorizationServer;
    const authorizationEndpoint = authorizationServer['authorization_endpoint'];

    if (!authorizationEndpoint) {
      throw new AuthenticationError('Authorization endpoint not available', 'ENDPOINT_NOT_FOUND');
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

  public async exchangeAuthCode(
    parameters: URLSearchParams,
    expectedState: string,
    codeVerifier: string,
  ): Promise<{ idToken: IDToken; tokens: TokenEndpointResponse }> {
    const authorizationServer = await this.authorizationServer;

    const callbackParameters = validateAuthResponse(authorizationServer, this.client, parameters, expectedState);

    try {
      const response = await authorizationCodeGrantRequest(
        authorizationServer,
        this.client,
        this.clientAuth,
        callbackParameters,
        this.callbackUrl.toString(),
        codeVerifier,
      );

      const tokenEndpointResponse = await processAuthorizationCodeResponse(authorizationServer, this.client, response, {
        requireIdToken: true,
      });

      const idToken = getValidatedIdTokenClaims(tokenEndpointResponse);

      if (!idToken) {
        throw new AuthenticationError('Failed to fetch ID token', 'ID_TOKEN_FETCH_FAILED');
      }

      return { idToken, tokens: tokenEndpointResponse };
    } catch (error) {
      throw new AuthenticationError(
        error instanceof Error ? error.message : 'Unknown error during token exchange',
        'TOKEN_EXCHANGE_FAILED',
      );
    }
  }

  private async discoverAuthorizationServer(issuerUrl: URL): Promise<AuthorizationServer> {
    try {
      const response = await discoveryRequest(issuerUrl);
      return processDiscoveryResponse(issuerUrl, response);
    } catch {
      throw new AuthenticationError('Failed to discover authorization server', 'DISCOVERY_FAILED');
    }
  }
}

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureAuthenticationStrategy extends BaseAuthenticationStrategy {
  /* placeholder for future code */
}
