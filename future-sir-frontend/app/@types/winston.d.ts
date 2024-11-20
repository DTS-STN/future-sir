import 'winston';

import type { logLevels } from '~/.server/express/environment';

type LogLevels = keyof typeof logLevels;

declare module 'winston' {
  interface Logger extends Record<LogLevels, LeveledLogMethod> {}
}

export {};
