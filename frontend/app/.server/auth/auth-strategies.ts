import { SpanStatusCode, trace } from '@opentelemetry/api';
import * as jose from 'jose';
import type { AuthorizationServer, Client, ClientAuth, IDToken } from 'oauth4webapi';
import * as oauth from 'oauth4webapi';

import { LogFactory } from '~/.server/logging';
import { withSpan } from '~/.server/utils/instrumentation-utils';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Like {@link AuthorizationServer}, but with a required
 * `authorization_endpoint` property and a required `jwks_uri` property.
 */
export interface AuthServer extends Readonly<AuthorizationServer> {
  readonly authorization_endpoint: string;
  readonly jwks_uri: string;
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
   * Decodes and verifies a JWT access token from the request.
   *
   * @param request - The incoming request containing the JWT access token.
   * @param expectedAudience - The expected audience of the JWT access token.
   * @returns A promise resolving to the decoded and verified JWT access token claims.
   */
  decodeAndVerifyJwt(jwt: string, expectedAudience: string): Promise<jose.JWTPayload & { roles?: string[] }>;

  /**
   * Generates a sign-in request with the specified scopes.
   *
   * @param scopes - The requested scopes (defaults to `['openid']`).
   * @returns A promise resolving to a `SignInRequest` object.
   */
  generateSigninRequest(callbackUrl: URL, scopes?: string[]): Promise<SignInRequest>;

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
    callbackUrl: URL,
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
  protected readonly client: Client;
  protected readonly clientAuth: ClientAuth;

  protected readonly log = LogFactory.getLogger(import.meta.url);
  protected readonly tracer = trace.getTracer('future-sir');

  protected constructor(name: string, issuerUrl: URL, client: Client, clientAuth: ClientAuth, allowInsecure = false) {
    this.allowInsecure = allowInsecure;
    this.client = client;
    this.clientAuth = clientAuth;
    this.name = name;

    this.authorizationServer = new Promise((resolve, reject) =>
      withSpan('auth.strategy.disovery', (span) => {
        this.log.debug('Fetching authorization server metadata');

        span.setAttributes({
          issuer_url: issuerUrl.toString(),
          strategy: this.name,
        });

        oauth
          .discoveryRequest(issuerUrl, { [oauth.allowInsecureRequests]: this.allowInsecure })
          .then((response) => oauth.processDiscoveryResponse(issuerUrl, response))
          .then((authorizationServer) => {
            this.log.trace('Fetched authorization server details', { authorizationServer });

            if (!authorizationServer.authorization_endpoint) {
              // this should never happen, but oauth4webapi allows for it so 🤷
              const errorMessage = 'Authorization endpoint not found in the discovery document';
              span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
              return reject(new AppError(errorMessage, ErrorCodes.DISCOVERY_ENDPOINT_MISSING));
            }

            if (!authorizationServer.jwks_uri) {
              // this should never happen, but oauth4webapi allows for it so 🤷
              const errorMessage = 'JWKs endpoint not found in the discovery document';
              span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
              return reject(new AppError(errorMessage, ErrorCodes.DISCOVERY_ENDPOINT_MISSING));
            }

            return resolve({
              ...authorizationServer,
              authorization_endpoint: authorizationServer.authorization_endpoint,
              jwks_uri: authorizationServer.jwks_uri,
            });
          })
          .catch((error) => reject(error));
      }),
    );
  }

  public generateSigninRequest = async (callbackUrl: URL, scopes: string[] = ['openid']): Promise<SignInRequest> =>
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
      authorizationEndpointUrl.searchParams.set('redirect_uri', callbackUrl.toString());
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
    callbackUrl: URL,
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
        callbackUrl.toString(),
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

  public async decodeAndVerifyJwt(jwt: string, expectedAudience: string): Promise<jose.JWTPayload & { roles?: string[] }> {
    this.log.debug('Performing JWT verification');
    const authorizationServer = await this.authorizationServer;
    const getKey = jose.createRemoteJWKSet(new URL(authorizationServer.jwks_uri));
    const options = { audience: expectedAudience, issuer: authorizationServer.issuer };
    return (await jose.jwtVerify<{ roles?: string[] }>(jwt, getKey, options)).payload;
  }
}

/**
 * Authentication strategy for Azure AD (Microsoft Entra).
 */
export class AzureADAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, clientId: string, clientSecret: string) {
    super('azuread', issuerUrl, { client_id: clientId }, oauth.ClientSecretPost(clientSecret));
  }
}

/**
 * Authentication strategy for a dev-only localhost provider.
 * This is a pretty typical authentication strategy, except all requests are allowed to be insecure.
 */
export class LocalAuthenticationStrategy extends BaseAuthenticationStrategy {
  public constructor(issuerUrl: URL, clientId: string, clientSecret: string) {
    super('local', issuerUrl, { client_id: clientId }, oauth.ClientSecretPost(clientSecret), true);
  }
}
