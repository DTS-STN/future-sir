import 'express-session';

declare module 'express-session' {
  interface SessionData extends Record<string, unknown> {
    accessToken: string;
    codeVerifier?: string;
    idToken?: string;
    idTokenClaims?: IDToken;
    returnUrl?: URL;
    state?: string;
  }
}

export {};
