declare module 'express-session' {
  interface SessionData {
    csrfToken: string;
    lastAccessTime: string;
  }
}

export {};
