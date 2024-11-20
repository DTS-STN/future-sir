import type { Tracer } from '@opentelemetry/api';
import { SpanStatusCode } from '@opentelemetry/api';
import type { AuthorizationServer, Client, ClientAuth, IDToken } from 'oauth4webapi';
import * as oauth from 'oauth4webapi';

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
  protected readonly tracer: Tracer;

  protected constructor(
    issuerUrl: URL,
    callbackUrl: URL,
    client: Client,
    clientAuth: ClientAuth,
    tracer: Tracer,
    allowInsecure = false,
  ) {
    this.allowInsecure = allowInsecure;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.clientAuth = clientAuth;
    this.tracer = tracer;

    // eslint-disable-next-line no-async-promise-executor
    this.authorizationServer = new Promise(async (resolve, reject) => {
      const span = this.tracer.startSpan('auth.strategy.disovery', {
        attributes: {
          issuer_url: issuerUrl.toString(),
          strategy: this.constructor.name,
        },
      });

      try {
        const response = await oauth.discoveryRequest(issuerUrl, { [oauth.allowInsecureRequests]: this.allowInsecure });
        const authorizationServer = await oauth.processDiscoveryResponse(issuerUrl, response);
        const { authorization_endpoint } = authorizationServer;

        if (!authorization_endpoint) {
          // this should never happen, but oauth4webapi allows for it so 🤷
          const errorMessage = 'Authorization endpoint not found in the discovery document';
          span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
          return reject(new Error('Authorization endpoint not found in the discovery document'));
        }

        return resolve({
          ...authorizationServer,
          authorization_endpoint,
        });
      } catch (error) {
        span.recordException({
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  public async generateSigninRequest(scopes: string[] = ['openid']): Promise<SignInRequest> {
    const span = this.tracer.startSpan('auth.strategy.generate_signin_request', {
      attributes: { scopes: scopes.join(' '), strategy: this.constructor.name },
    });

    try {
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
    } catch (error) {
      span.recordException({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  }

  public async exchangeAuthCode(
    parameters: URLSearchParams,
    expectedNonce: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<TokenSet> {
    const span = this.tracer.startSpan('auth.strategy.exchange_auth_code', {
      attributes: { strategy: this.constructor.name },
    });

    try {
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
    } catch (error) {
      span.recordException({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
