import { z } from 'zod';

import { logLevels } from '~/.server/logging';
import { isIn } from '~/utils/validation-utils';

export type Logging = Readonly<z.infer<typeof logging>>;

export const logging = z.object({
  LOG_LEVEL: z
    .string()
    .default(
      process.env.NODE_ENV === 'production' //
        ? 'info'
        : 'debug',
    )
    .refine(isIn(logLevels)),
});
