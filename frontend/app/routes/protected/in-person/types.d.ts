import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { machine } from '~/routes/protected/in-person/state-machine.server';

type Snapshot = SnapshotFrom<typeof machine>;

declare module 'express-session' {
  interface SessionData {
    inPersonFlow: Record<string, Snapshot | undefined>;
  }
}

export {};
