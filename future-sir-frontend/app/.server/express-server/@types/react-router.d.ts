import 'react-router';

import type { Request } from 'express';

import type { ClientEnvironment, ServerEnvironment } from '../environment.server';
import type { GetLoggerFunction } from '../logging.server';

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
