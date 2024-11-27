import 'react-router';

import type { Request } from 'express';

import type { getEnvironment } from '../server/environment.server.mjs';
import type { getLogger } from '../server/logging.server.mjs';

declare module 'react-router' {
  interface AppLoadContext {
    environment: ReturnType<typeof getEnvironment>;
    getLogger: typeof getLogger;
    nonce: string;
    session: Request['session'];
  }
}

export {};
