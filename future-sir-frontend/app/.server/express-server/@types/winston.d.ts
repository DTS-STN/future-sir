import type { logLevels } from '../environment.server';

type LogLevels = keyof typeof logLevels;

declare module 'winston' {
  interface Logger extends Record<LogLevels, LeveledLogMethod> {}
}

export {};
