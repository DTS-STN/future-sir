import 'express-session';

import type { IDTokenClaims } from '~/.server/auth/auth-strategies';
import type { PersonSinCase } from '~/.server/domain/multi-channel/case-api-service-models';

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
    createdCases: Record<string, PersonSinCase>;
  }
}

export {};
