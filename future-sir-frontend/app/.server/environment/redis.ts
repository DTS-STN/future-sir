import { z } from 'zod';

import { asNumber, redact } from '~/utils/validation-utils';

export type Redis = Readonly<z.infer<typeof redis>>;

export const redis = z.object({
  REDIS_CONNECTION_TYPE: z.enum(['sentinel', 'standalone']).default('standalone'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: asNumber(z.string().default('6379')).pipe(z.number().min(0)),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: redact(z.string().optional()),
  REDIS_SENTINEL_MASTER_NAME: z.string().optional(),
  REDIS_COMMAND_TIMEOUT_SECONDS: asNumber(z.string().default('1')).pipe(z.number().min(0)),
});
