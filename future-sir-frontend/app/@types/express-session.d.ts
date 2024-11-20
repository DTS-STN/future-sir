import 'express-session';

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
