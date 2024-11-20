import { z } from 'zod';

import { asNumber, redact } from '~/utils/validation-utils';

export type Redis = Readonly<z.infer<typeof redis>>;

export const defaults = {
  DEFAULT_REDIS_COMMAND_TIMEOUT_SECONDS: '1',
  DEFAULT_REDIS_CONNECTION_TYPE: 'standalone',
  DEFAULT_REDIS_HOST: 'localhost',
  DEFAULT_REDIS_PORT: '6379',
} as const;

export const redis = z.object({
  REDIS_CONNECTION_TYPE: z.enum(['sentinel', 'standalone']).default(defaults.DEFAULT_REDIS_CONNECTION_TYPE),
  REDIS_HOST: z.string().default(defaults.DEFAULT_REDIS_HOST),
  REDIS_PORT: asNumber(z.string().default(defaults.DEFAULT_REDIS_PORT)).pipe(z.number().min(0)),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: redact(z.string().optional()),
  REDIS_SENTINEL_MASTER_NAME: z.string().optional(),
  REDIS_COMMAND_TIMEOUT_SECONDS: asNumber(z.string().default(defaults.DEFAULT_REDIS_COMMAND_TIMEOUT_SECONDS)).pipe(
    z.number().min(0),
  ),
});
