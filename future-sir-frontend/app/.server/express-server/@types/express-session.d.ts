import 'express-session';

declare module 'express-session' {
  interface SessionData extends Record<string, unknown> {}
}

export {};
