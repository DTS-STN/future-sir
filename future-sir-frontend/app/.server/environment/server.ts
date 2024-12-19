import { z, ZodIssueCode } from 'zod';

import { authentication, defaults as authenticationDefaults } from '~/.server/environment/authentication';
import { client, defaults as clientDefaults } from '~/.server/environment/client';
import { features, defaults as featuresDefaults } from '~/.server/environment/features';
import { logging, defaults as loggingDefaults } from '~/.server/environment/logging';
import { redis, defaults as redisDefaults } from '~/.server/environment/redis';
import { session, defaults as sessionDefaults } from '~/.server/environment/session';
import { telemetry, defaults as telemetryDefaults } from '~/.server/environment/telemetry';
import { LogFactory } from '~/.server/logging';
import * as ValidationUtils from '~/utils/validation-utils';

const log = LogFactory.getLogger(import.meta.url);

export type Server = Readonly<z.infer<typeof server>>;

export const defaults = {
  NODE_ENV: 'development',
  PORT: '3000',
  ...authenticationDefaults,
  ...clientDefaults,
  ...featuresDefaults,
  ...loggingDefaults,
  ...redisDefaults,
  ...sessionDefaults,
  ...telemetryDefaults,
} as const;

/**
 * Server-side environment variables.
 * Also includes all client-side variables.
 */
export const server = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default(defaults.NODE_ENV),
    PORT: ValidationUtils.asNumber(z.string().default(defaults.PORT)).pipe(z.number().min(0)),
  })
  .merge(authentication)
  .merge(client)
  .merge(features)
  .merge(logging)
  .merge(redis)
  .merge(session)
  .merge(telemetry)
  .superRefine((data, ctx) => {
    const isSentinel = data.REDIS_CONNECTION_TYPE === 'sentinel';
    const hasMasterName = data.REDIS_SENTINEL_MASTER_NAME !== undefined;

    if (isSentinel && !hasMasterName) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['REDIS_SENTINEL_MASTER_NAME'],
        message: 'REDIS_SENTINEL_MASTER_NAME is required when REDIS_CONNECTION_TYPE is sentinel',
      });
    }

    warn(
      data.isProduction && data.ENABLE_DEVMODE_OIDC === true,
      'Setting ENABLE_DEVMODE_OIDC=true is not recommended in production!',
    );
  });

/**
 * Logs a warning if the check evaluates to true.
 * Always returns true so it can be used in a zod refine() function.
 */
function warn(check: boolean, message: string): true {
  return check && log.warn(message), true;
}
