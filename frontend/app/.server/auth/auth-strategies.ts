import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { AuthorizationServer, Client, ClientAuth, IDToken } from 'oauth4webapi';
import * as oauth from 'oauth4webapi';

import { LogFactory } from '~/.server/logging';
import { withSpan } from '~/.server/utils/instrumentation-utils';

/**
 * Like {@link AuthorizationServer}, but with a required `authorization_endpoint` property.
 */
export interface AuthServer extends Readonly<AuthorizationServer> {
  readonly authorization_endpoint: string;
}

/**
 * Like {@link IDToken}, but with an optional `roles` property.
 */
export interface IDTokenClaims extends IDToken {
  roles?: string[];
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
  readonly idTokenClaims?: IDTokenClaims;
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

  /**
   * The name of the implementation strategy.
   */
  name: string;
}

/**
 * Abstract base class for OAuth authentication strategies.
 */
export abstract class BaseAuthenticationStrategy implements AuthenticationStrategy {
  public readonly name: string;

  protected readonly allowInsecure: boolean;
  protected readonly authorizationServer: Promise<AuthServer>;
  protected readonly callbackUrl: URL;
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  protected readonly log = LogFactory.getLogger(import.meta.url);
  protected readonly tracer = trace.getTracer('future-sir');

  protected constructor(
    name: string,
    issuerUrl: URL,
    callbackUrl: URL,
    client: Client,
    clientAuth: ClientAuth,
    allowInsecure = false,
  ) {
    this.allowInsecure = allowInsecure;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.clientAuth = clientAuth;
    this.name = name;

    // eslint-disable-next-line no-async-promise-executor
    this.authorizationServer = new Promise(async (resolve, reject) =>
      withSpan('auth.strategy.disovery', async (span) => {
        this.log.debug('Fetching authorization server metadata');

        span.setAttributes({
          issuer_url: issuerUrl.toString(),
          strategy: this.name,
        });

        const response = await oauth.discoveryRequest(issuerUrl, { [oauth.allowInsecureRequests]: this.allowInsecure });
        const authorizationServer = await oauth.processDiscoveryResponse(issuerUrl, response);
        this.log.trace('Fetched authorization server details', { authorizationServer });

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
      this.log.debug('Generating sign-in request', { strategy: this.name, scopes });

      span.setAttributes({
        scopes: scopes.join(' '),
        strategy: this.name,
      });

      const authorizationServer = await this.authorizationServer;

      const codeVerifier = oauth.generateRandomCodeVerifier();
      const nonce = oauth.generateRandomNonce();
      const state = oauth.generateRandomState();

      const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
      this.log.trace('Calculated code challenge', { codeChallenge });

      const authorizationEndpointUrl = new URL(authorizationServer.authorization_endpoint);
      authorizationEndpointUrl.searchParams.set('client_id', this.client.client_id);
      authorizationEndpointUrl.searchParams.set('code_challenge_method', 'S256');
      authorizationEndpointUrl.searchParams.set('code_challenge', codeChallenge);
      authorizationEndpointUrl.searchParams.set('nonce', nonce);
      authorizationEndpointUrl.searchParams.set('redirect_uri', this.callbackUrl.toString());
      authorizationEndpointUrl.searchParams.set('response_type', 'code');
      authorizationEndpointUrl.searchParams.set('scope', scopes.join(' '));
      authorizationEndpointUrl.searchParams.set('state', state);
      this.log.trace('Constructed authorization endpoint URL', {
        authorizationEndpointUrl: authorizationEndpointUrl.toString(),
      });

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
      this.log.debug('Exchanging authorization code for tokens');

      span.setAttributes({
        strategy: this.name,
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

      const tokenEndpointResponse = await oauth.processAuthorizationCodeResponse(
        authorizationServer, //
        this.client,
        response,
        { expectedNonce },
      );

      this.log.trace('Received token response', { tokenEndpointResponse });

      const idTokenClaims = oauth.getValidatedIdTokenClaims(tokenEndpointResponse);

      return {
        accessToken: tokenEndpointResponse.access_token,
        idToken: tokenEndpointResponse.id_token,
        idTokenClaims: idTokenClaims,
      };
    });
}

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureADAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super('azuread', issuerUrl, callbackUrl, { client_id: clientId }, oauth.ClientSecretPost(clientSecret));
  }
}

/**
 * Authentication strategy for a dev-only localhost provider.
 * This is a pretty typical authentication strategy, except all requests are allowed to be insecure.
 */
export class LocalAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) {
    super('local', issuerUrl, callbackUrl, { client_id: clientId }, oauth.ClientSecretPost(clientSecret), true);
  }
}
