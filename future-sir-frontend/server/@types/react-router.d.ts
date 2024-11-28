import type { Request } from 'express';

import type { ClientEnvironment, ServerEnvironment } from '../environment.server.mjs';
import type { getLogger } from '../server/logging.server.mjs';

declare module 'react-router' {
  interface AppLoadContext {
    clientEnvironment: ClientEnvironment;
    serverEnvironment: ServerEnvironment;
    getLogger: typeof getLogger;
    nonce: string;
    session: Request['session'];
  }
}

export {};
