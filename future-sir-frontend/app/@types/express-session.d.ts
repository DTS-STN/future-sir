import 'express-session';
import type { IDToken } from 'oauth4webapi';

declare module 'express-session' {
  interface SessionData extends Record<string, unknown> {
    authState?: {
      accessToken: string;
      idToken?: string;
      idTokenClaims?: IDToken;
    };
    loginState?: {
      codeVerifier: string;
      nonce: string;
      returnUrl?: URL;
      state: string;
    };
  }
}

export {};
