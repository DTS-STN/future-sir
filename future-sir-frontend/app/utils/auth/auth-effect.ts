import { Data, Effect } from 'effect';
import type { ClientAuth } from 'oauth4webapi';
import * as oauth from 'oauth4webapi';

export class ServerDiscoveryError extends Data.TaggedError('ServerDiscoveryError')<{
  cause?: unknown;
  message: string;
}> {}

export class PKCEError extends Data.TaggedError('PKCEError')<{
  cause?: unknown;
  message: string;
}> {}

export class TokenExchangeError extends Data.TaggedError('TokenExchangeError')<{
  cause?: unknown;
  message: string;
}> {}

export interface AuthConfig {
  readonly issuerUrl: URL;
  readonly callbackUrl: URL;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly allowInsecure?: boolean;
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
  readonly idTokenClaims?: oauth.IDToken;
}

export interface AuthStrategy {
  generateSigninRequest: (scopes?: string[]) => Effect.Effect<SignInRequest, ServerDiscoveryError | PKCEError, never>;

  exchangeAuthcode: (
    parameters: URLSearchParams,
    expectedNonce: string,
    expectedState: string,
    codeVerifier: string,
  ) => Effect.Effect<TokenSet, ServerDiscoveryError | TokenExchangeError, never>;
}

export const createAuthStrategy = (config: AuthConfig) => {
  const discoverAuthServer = Effect.gen(function* ($) {
    const { allowInsecure, issuerUrl } = config;

    const response = yield* $(
      Effect.tryPromise({
        try: () => oauth.discoveryRequest(issuerUrl, { [oauth.allowInsecureRequests]: allowInsecure }),
        catch: (error) =>
          new ServerDiscoveryError({
            message: 'Discovery request failed',
            cause: error,
          }),
      }).pipe(Effect.withSpan('discovery_request')),
    );

    const result = yield* $(
      Effect.tryPromise({
        try: () => oauth.processDiscoveryResponse(issuerUrl, response),
        catch: (error) =>
          new ServerDiscoveryError({
            message: 'Failed to process discovery response',
            cause: error,
          }),
      }).pipe(Effect.withSpan('discovery_response')),
    );

    if (!result.authorization_endpoint || !result.token_endpoint) {
      return yield* $(
        Effect.fail(
          new ServerDiscoveryError({
            message: 'Missing required endpoints in discovery response',
          }),
        ),
      ).pipe(Effect.withSpan('endpoint_validation'));
    }

    return {
      ...result,
      authorization_endpoint: result.authorization_endpoint,
      token_endpoint: result.token_endpoint,
    };
  }).pipe(Effect.withSpan('discover_auth_server'));

  return {
    generateSigninRequest: (scopes: string[] = ['oidc']) =>
      Effect.gen(function* ($) {
        const authServer = yield* $(discoverAuthServer);

        const codeVerifier = oauth.generateRandomCodeVerifier();

        const codeChallenge = yield* $(
          Effect.tryPromise({
            try: () => oauth.calculatePKCECodeChallenge(codeVerifier),
            catch: (error) =>
              new PKCEError({
                message: 'Failed to generate PKCE challenge',
                cause: error,
              }),
          }).pipe(Effect.withSpan('calculate_pkce_challenge')),
        );

        const nonce = oauth.generateRandomNonce();
        const state = oauth.generateRandomState();

        const authorizationEndpointUrl = new URL(authServer.authorization_endpoint);
        authorizationEndpointUrl.searchParams.set('client_id', config.clientId);
        authorizationEndpointUrl.searchParams.set('code_challenge_method', 'S256');
        authorizationEndpointUrl.searchParams.set('code_challenge', codeChallenge);
        authorizationEndpointUrl.searchParams.set('nonce', nonce);
        authorizationEndpointUrl.searchParams.set('redirect_uri', config.callbackUrl.toString());
        authorizationEndpointUrl.searchParams.set('response_type', 'code');
        authorizationEndpointUrl.searchParams.set('scope', scopes.join(' '));
        authorizationEndpointUrl.searchParams.set('state', state);

        return {
          authorizationEndpointUrl,
          codeVerifier,
          nonce,
          state,
        };
      }).pipe(Effect.withSpan('generate_signin_request')),

    exchangeAuthcode: (parameters: URLSearchParams, expectedNonce: string, expectedState: string, codeVerifier: string) =>
      Effect.gen(function* ($) {
        const authServer = yield* $(discoverAuthServer);
        const { allowInsecure, callbackUrl, clientId, clientSecret } = config;

        const client = { client_id: clientId };
        const clientAuth: ClientAuth = oauth.ClientSecretPost(clientSecret);

        const callbackParameters = yield* $(
          Effect.try({
            try: () => oauth.validateAuthResponse(authServer, client, parameters, expectedState),
            catch: (error) =>
              new TokenExchangeError({
                message: 'Failed to validate auth response',
                cause: error,
              }),
          }),
        ).pipe(Effect.withSpan('validate_auth_response'));

        const response = yield* $(
          Effect.tryPromise({
            try: () =>
              oauth.authorizationCodeGrantRequest(
                authServer,
                client,
                clientAuth,
                callbackParameters,
                callbackUrl.toString(),
                codeVerifier,
                { [oauth.allowInsecureRequests]: allowInsecure },
              ),
            catch: (error) =>
              new TokenExchangeError({
                message: 'Failed to exchange authcode for token',
                cause: error,
              }),
          }),
        ).pipe(Effect.withSpan('authorization_code_grant_request'));

        const tokenResponse = yield* $(
          Effect.tryPromise({
            try: () => oauth.processAuthorizationCodeResponse(authServer, client, response, { expectedNonce }),
            catch: (error) =>
              new TokenExchangeError({
                message: 'Failed to process token response',
                cause: error,
              }),
          }),
        ).pipe(Effect.withSpan('process_authorization_code_response'));

        const idTokenClaims = oauth.getValidatedIdTokenClaims(tokenResponse);

        return {
          accessToken: tokenResponse.access_token,
          idToken: tokenResponse.id_token,
          idTokenClaims,
        };
      }).pipe(Effect.withSpan('exchange_authcode')),
  };
};

export const createAzureAuthStrategy = (issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) =>
  createAuthStrategy({ issuerUrl, callbackUrl, clientId, clientSecret });

export const createLocalAuthStrategy = (issuerUrl: URL, callbackUrl: URL, clientId: string, clientSecret: string) =>
  createAuthStrategy({ issuerUrl, callbackUrl, clientId, clientSecret, allowInsecure: true });
