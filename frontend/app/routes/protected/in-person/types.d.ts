import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { machine } from '~/routes/protected/in-person/state-machine';

type MachineType = SnapshotFrom<typeof machine>;

declare module 'express-session' {
  interface SessionData {
    inPersonFlow: Record<string, MachineType | undefined>;
  }
}

export {};
