import 'express-session';

import type { PersonSinCase } from '~/.server/domain/multi-channel/services/case-api-service';

declare module 'express-session' {
  interface SessionData {
    editingSinCase: PersonSinCase;
  }
}

export {};
