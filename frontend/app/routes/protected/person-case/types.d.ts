import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { Machine } from '~/routes/protected/person-case/state-machine.server';
import type { InPersonSinApplication } from '~/routes/protected/sin-application/types';

export type FormData = {
  [K in keyof InPersonSinApplication]?: {
    values?: Record<string, string | undefined>;
    errors?: Record<string, [string, ...string[]] | undefined>;
  };
};

declare module 'express-session' {
  interface SessionData {
    inPersonSinApplications: Record<string, SnapshotFrom<Machine> | undefined>;
  }
}

export {};
