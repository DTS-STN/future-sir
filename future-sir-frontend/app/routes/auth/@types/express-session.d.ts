import 'express-session';
import type { IDToken, TokenEndpointResponse } from 'oauth4webapi';

declare module 'express-session' {
  interface SessionData {
    codeVerifier?: string;
    idToken?: IDToken;
    returnUrl?: URL;
    state?: string;
    tokens?: TokenEndpointResponse;
  }
}

export {};
