import 'express-session';

import type { IDTokenClaims } from '~/utils/auth/authentication-strategy';

declare module 'express-session' {
  interface SessionData extends Record<string, unknown> {
    authState?: {
      accessToken: string;
      idToken?: string;
      idTokenClaims?: IDTokenClaims;
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
