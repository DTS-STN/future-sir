import 'winston';

import type { logLevels } from '../server/environment.server.mjs';

type LogLevels = keyof typeof logLevels;

declare module 'winston' {
  interface Logger extends Record<LogLevels, winston.LeveledLogMethod> {}
}

export {};
