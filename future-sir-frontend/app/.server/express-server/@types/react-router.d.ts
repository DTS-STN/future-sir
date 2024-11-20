import type { Request } from 'express';

import type { ClientEnvironment, ServerEnvironment } from '../server/environment.server';
import type { GetLoggerFunction } from '../server/logging.server';

declare module 'react-router' {
  interface AppLoadContext {
    csrfToken: string;
    environment: {
      client: ClientEnvironment;
      server: ServerEnvironment;
    };
    logFactory: {
      getLogger: GetLoggerFunction;
    };
    nonce: string;
    session: Request['session'];
  }
}

export {};
