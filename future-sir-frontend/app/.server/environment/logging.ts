import { z } from 'zod';

import { logLevels } from '~/.server/logging';
import { isIn } from '~/utils/validation-utils';

export type Logging = Readonly<z.infer<typeof logging>>;

export const defaults = {
  DEFAULT_LOG_LEVEL:
    process.env.NODE_ENV === 'production' //
      ? 'info'
      : 'debug',
} as const;

export const logging = z.object({
  LOG_LEVEL: z.string().default(defaults.DEFAULT_LOG_LEVEL).refine(isIn(logLevels)),
});
