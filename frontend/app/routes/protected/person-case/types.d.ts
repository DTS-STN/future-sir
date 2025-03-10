import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { Machine } from '~/routes/protected/person-case/state-machine.server';

declare module 'express-session' {
  interface SessionData {
    inPersonSinApplications: Record<string, SnapshotFrom<Machine> | undefined>;
  }
}

export {};
