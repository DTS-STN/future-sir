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
     * Represents the session data for the in-person SIN case.
     */
    inPersonSINCase: {
      firstName?: string;
      lastName?: string;
      /**
       * Represents the privacy statement data for the in-person SIN case.
       */
      privacyStatement?: {
        /**
         * Indicates whether the user has agreed to the terms of the privacy statement.
         */
        agreedToTerms: true;
      };
      requestDetails?: {
        type: string;
        scenario: string;
      };
      primaryDocuments?: {
        currentStatusInCanada: string;
        documentType: string;
      };
    };
  }
}

export {};
