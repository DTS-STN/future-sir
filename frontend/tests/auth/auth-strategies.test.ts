import * as oauth from 'oauth4webapi';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { BaseAuthenticationStrategy } from '~/.server/auth/auth-strategies';
import { ErrorCodes } from '~/errors/error-codes';

vi.mock('oauth4webapi');

describe('BaseAuthenticationStrategy', () => {
  class TestAuthStrategy extends BaseAuthenticationStrategy {
    constructor() {
      super(
        'test',
        new URL('https://auth.example.com/issuer'),
        { client_id: 'test_client_id' },
        oauth.ClientSecretPost('test_client_secret'),
      );
    }

    // expose protected authorizationServer (for testing)
    public getAuthorizationServer() {
      return this.authorizationServer;
    }
  }

  describe('constructor', () => {
    it('should initialize AuthorizationServer correctly', async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(mock());

      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
        jwks_uri: 'https://auth.example.com/jwks',
      });

      const authServer = await new TestAuthStrategy().getAuthorizationServer();

      expect(authServer).toEqual({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
        jwks_uri: 'https://auth.example.com/jwks',
      });
    });

    it('should reject if no authorization endpoint is found', async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(mock());

      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: undefined,
      } as oauth.AuthorizationServer);

      await expect(async () => await new TestAuthStrategy().getAuthorizationServer()).rejects.contains({
        msg: 'Authorization endpoint not found in the discovery document',
        errorCode: ErrorCodes.DISCOVERY_ENDPOINT_MISSING,
      });
    });
  });

  describe('generateSigninRequest', () => {
    it('should generate signin request with default openid scope', async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(mock());

      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
        jwks_uri: 'https://auth.example.com/jwks',
      });

      vi.mocked(oauth.generateRandomCodeVerifier).mockReturnValue('mock_code_verifier');
      vi.mocked(oauth.generateRandomNonce).mockReturnValue('mock_nonce');
      vi.mocked(oauth.generateRandomState).mockReturnValue('mock_state');
      vi.mocked(oauth.calculatePKCECodeChallenge).mockResolvedValue('mock_code_challenge');

      const callbackUrl = new URL('https://auth.example.com/callback');
      const signinRequest = await new TestAuthStrategy().generateSigninRequest(callbackUrl);

      expect(signinRequest).toEqual({
        // prettier-ignore
        authorizationEndpointUrl:
          new URL('https://auth.example.com/authorize' +
            '?client_id=test_client_id' +
            '&code_challenge_method=S256' +
            '&code_challenge=mock_code_challenge' +
            '&nonce=mock_nonce' +
            '&redirect_uri=https%3A%2F%2Fauth.example.com%2Fcallback' +
            '&response_type=code' +
            '&scope=openid' +
            '&state=mock_state'),
        codeVerifier: 'mock_code_verifier',
        nonce: 'mock_nonce',
        state: 'mock_state',
      });
    });
  });

  describe('exchangeAuthCode', () => {
    it('should exchange authorization code for tokens', async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(mock());

      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
        jwks_uri: 'https://auth.example.com/jwks',
      });

      vi.mocked(oauth.processAuthorizationCodeResponse).mockResolvedValue({
        access_token: 'test_access_token',
        token_type: 'bearer',
        id_token: 'test_id_token',
      });

      vi.mocked(oauth.getValidatedIdTokenClaims).mockReturnValue({
        iss: 'https://auth.example.com/issuer',
        sub: 'test_subject',
        aud: 'test_client_id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const strategy = new TestAuthStrategy();

      const callbackUrl = new URL('https://auth.example.com/callback');
      const tokenSet = await strategy.exchangeAuthCode(
        callbackUrl,
        new URLSearchParams({
          code: 'test_code',
          state: 'mock_state',
        }),
        'mock_nonce',
        'mock_state',
        'mock_code_verifier',
      );

      expect(tokenSet).toEqual({
        accessToken: 'test_access_token',
        idToken: 'test_id_token',
        idTokenClaims: {
          iss: 'https://auth.example.com/issuer',
          sub: 'test_subject',
          aud: 'test_client_id',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    });
  });
});
