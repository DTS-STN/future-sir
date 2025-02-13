import * as v from 'valibot';

import { logLevels } from '~/.server/logging';
import type { LogLevel } from '~/.server/logging';

export type Logging = Readonly<v.InferOutput<typeof logging>>;

const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  LOG_LEVEL: isProduction ? 'info' : 'debug',
} as const;

export const logging = v.object({
  LOG_LEVEL: v.optional(v.picklist(Object.keys(logLevels) as LogLevel[]), defaults.LOG_LEVEL),
});
