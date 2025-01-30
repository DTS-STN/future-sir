import 'express-session';

import type { IDTokenClaims } from '~/.server/auth/auth-strategies';

declare module 'express-session' {
  interface SessionData {
    authState: {
      accessToken: string;
      idToken?: string;
      idTokenClaims?: IDTokenClaims;
    };
    loginState: {
      codeVerifier: string;
      nonce: string;
      returnUrl?: URL;
      state: string;
    };
    /**
     * Stores data for an in-person SIN case
     */
    inPersonSINCase: {
      firstName?: string;
      lastName?: string;
      confirmPrivacyNotice?: string;
    };
  }
}

export {};
