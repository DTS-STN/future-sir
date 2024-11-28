import type { LogLevels } from '../server/environment.server.mjs';

declare module 'winston' {
  interface Logger extends Record<keyof LogLevels, LeveledLogMethod> {}
}

export {};
