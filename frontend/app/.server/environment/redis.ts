import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

export type Redis = Readonly<z.infer<typeof redis>>;

export const defaults = {
  REDIS_COMMAND_TIMEOUT_SECONDS: '1',
  REDIS_CONNECTION_TYPE: 'standalone',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
} as const;

export const redis = z.object({
  REDIS_CONNECTION_TYPE: z.enum(['sentinel', 'standalone']).default(defaults.REDIS_CONNECTION_TYPE),
  REDIS_HOST: z.string().default(defaults.REDIS_HOST),
  REDIS_PORT: ValidationUtils.asNumber(z.string().default(defaults.REDIS_PORT)).pipe(z.number().min(0)),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: ValidationUtils.redact(z.string().optional()),
  REDIS_SENTINEL_MASTER_NAME: z.string().optional(),
  REDIS_COMMAND_TIMEOUT_SECONDS: ValidationUtils.asNumber(
    z.string().default(defaults.REDIS_COMMAND_TIMEOUT_SECONDS), //
  ).pipe(z.number().min(0)),
});
