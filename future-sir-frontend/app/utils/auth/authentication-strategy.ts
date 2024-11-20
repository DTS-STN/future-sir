import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { AuthorizationServer, Client, ClientAuth, IDToken } from 'oauth4webapi';
import * as oauth from 'oauth4webapi';

import { withSpan } from '../instrumentation-utils';

/**
 * Like {@link AuthorizationServer}, but with a required `authorization_endpoint` property.
 */
export interface AuthServer extends Readonly<AuthorizationServer> {
  readonly authorization_endpoint: string;
}

/**
 * Represents a sign-in request object containing the authorization URL, code verifier, nonce, and state.
 */
export interface SignInRequest {
  readonly authorizationEndpointUrl: URL;
  readonly codeVerifier: string;
  readonly nonce: string;
  readonly state: string;
}

/**
 * Represents a token set containing access token and optional id token and id token claims.
 */
export interface TokenSet {
  readonly accessToken: string;
  readonly idToken?: string;
  readonly idTokenClaims?: IDToken;
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
export abstract class BaseAuthenticationStrategy implements AuthenticationStrategy {
  protected readonly allowInsecure: boolean;
  protected readonly authorizationServer: Promise<AuthServer>;
  protected readonly callbackUrl: URL;
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  protected readonly tracer = trace.getTracer('future-sir');

  protected constructor(issuerUrl: URL, callbackUrl: URL, client: Client, clientAuth: ClientAuth, allowInsecure = false) {
    this.allowInsecure = allowInsecure;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.clientAuth = clientAuth;

    // eslint-disable-next-line no-async-promise-executor
    this.authorizationServer = new Promise(async (resolve, reject) =>
      withSpan('auth.strategy.disovery', async (span) => {
        span.setAttributes({
          issuer_url: issuerUrl.toString(),
          strategy: this.constructor.name,
        });

        const response = await oauth.discoveryRequest(issuerUrl, { [oauth.allowInsecureRequests]: this.allowInsecure });
        const authorizationServer = await oauth.processDiscoveryResponse(issuerUrl, response);
        const { authorization_endpoint } = authorizationServer;

        if (!authorization_endpoint) {
          // this should never happen, but oauth4webapi allows for it so 🤷
          const errorMessage = 'Authorization endpoint not found in the discovery document';
          span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
          return reject(new Error(errorMessage));
        }

        return resolve({
          ...authorizationServer,
          authorization_endpoint,
        });
      }),
    );
  }

  public generateSigninRequest = async (scopes: string[] = ['openid']): Promise<SignInRequest> =>
    withSpan('auth.strategy.generate_signin_request', async (span) => {
      span.setAttributes({
        scopes: scopes.join(' '),
        strategy: this.constructor.name,
      });

      const authorizationServer = await this.authorizationServer;

      const codeVerifier = oauth.generateRandomCodeVerifier();
      const nonce = oauth.generateRandomNonce();
      const state = oauth.generateRandomState();

      const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

      const authorizationEndpointUrl = new URL(authorizationServer.authorization_endpoint);
      authorizationEndpointUrl.searchParams.set('client_id', this.client.client_id);
      authorizationEndpointUrl.searchParams.set('code_challenge_method', 'S256');
      authorizationEndpointUrl.searchParams.set('code_challenge', codeChallenge);
      authorizationEndpointUrl.searchParams.set('nonce', nonce);
      authorizationEndpointUrl.searchParams.set('redirect_uri', this.callbackUrl.toString());
      authorizationEndpointUrl.searchParams.set('response_type', 'code');
      authorizationEndpointUrl.searchParams.set('scope', scopes.join(' '));
      authorizationEndpointUrl.searchParams.set('state', state);

      return {
        authorizationEndpointUrl,
        codeVerifier,
        nonce,
        state,
      };
    });

  public exchangeAuthCode = async (
    parameters: URLSearchParams,
    expectedNonce: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<TokenSet> =>
    withSpan('auth.strategy.exchange_auth_code', async (span) => {
      span.setAttributes({
        strategy: this.constructor.name,
      });

      const authorizationServer = await this.authorizationServer;

      const callbackParameters = oauth.validateAuthResponse(authorizationServer, this.client, parameters, expectedState);

      const response = await oauth.authorizationCodeGrantRequest(
        authorizationServer,
        this.client,
        this.clientAuth,
        callbackParameters,
        this.callbackUrl.toString(),
        codeVerifier,
        { [oauth.allowInsecureRequests]: this.allowInsecure },
      );

      const tokenEndpointResponse = await oauth.processAuthorizationCodeResponse(authorizationServer, this.client, response, {
        expectedNonce,
      });

      const idTokenClaims = oauth.getValidatedIdTokenClaims(tokenEndpointResponse);

      return {
        accessToken: tokenEndpointResponse.access_token,
        idToken: tokenEndpointResponse.id_token,
        idTokenClaims: idTokenClaims,
      };
    });
}
