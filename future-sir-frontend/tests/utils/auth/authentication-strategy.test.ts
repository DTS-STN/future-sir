import type { Tracer } from '@opentelemetry/api';
import * as oauth from 'oauth4webapi';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { BaseAuthenticationStrategy } from '~/utils/auth/authentication-strategy';

vi.mock('oauth4webapi');

describe('BaseAuthenticationStrategy', () => {
  class TestAuthStrategy extends BaseAuthenticationStrategy {
    constructor() {
      super(
        new URL('https://auth.example.com/issuer'),
        new URL('https://auth.example.com/callback'),
        { client_id: 'test_client_id' },
        oauth.ClientSecretPost('test_client_secret'),
        mock<Tracer>({
          startSpan: vi.fn().mockReturnValue({
            setStatus: vi.fn(),
            recordException: vi.fn(),
            end: vi.fn(),
          }),
        }),
      );
    }

    // expose protected authorizationServer (for testing)
    public async getAuthorizationServer() {
      return this.authorizationServer;
    }
  }

  describe('constructor', () => {
    it('should initialize AuthorizationServer correctly', async () => {
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
      });

      const authServer = await new TestAuthStrategy().getAuthorizationServer();

      expect(authServer).toEqual({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
      });
    });

    it('should throw error if no authorization endpoint is found', async () => {
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: undefined,
      } as oauth.AuthorizationServer);

      await expect(async () => await new TestAuthStrategy().getAuthorizationServer()).rejects.toThrow(
        'Authorization endpoint not found in the discovery document',
      );
    });
  });

  describe('generateSigninRequest', () => {
    it('should generate signin request with default openid scope', async () => {
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
      });

      vi.mocked(oauth.generateRandomCodeVerifier).mockReturnValue('mock_code_verifier');
      vi.mocked(oauth.generateRandomNonce).mockReturnValue('mock_nonce');
      vi.mocked(oauth.generateRandomState).mockReturnValue('mock_state');
      vi.mocked(oauth.calculatePKCECodeChallenge).mockResolvedValue('mock_code_challenge');

      const signinRequest = await new TestAuthStrategy().generateSigninRequest();

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
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        issuer: 'https://auth.example.com/issuer',
        authorization_endpoint: 'https://auth.example.com/authorize',
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

      const tokenSet = await strategy.exchangeAuthCode(
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
