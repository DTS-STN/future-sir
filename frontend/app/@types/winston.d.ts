import 'winston';

import type { LogLevel } from '~/.server/logging';

declare module 'winston' {
  interface Logger extends Record<LogLevel, LeveledLogMethod> {}
}

export {};
