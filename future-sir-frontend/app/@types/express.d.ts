import 'express-session';

/**
 * Augment the `react-router` namespace with our custom route handle type definitions.
 */
declare module 'express-session' {
  interface SessionData {
    lastAccessTime: string;
  }
}

export {};
