import 'react-router';

import type { Request } from 'express';

import type { getClientEnvironment, getServerEnvironment } from '../server/environment.server.mjs';
import type { getLogger } from '../server/logging.server.mjs';

declare module 'react-router' {
  interface AppLoadContext {
    clientEnvironment: ReturnType<typeof getClientEnvironment>;
    serverEnvironment: ReturnType<typeof getServerEnvironment>;
    getLogger: typeof getLogger;
    nonce: string;
    session: Request['session'];
  }
}

export {};
