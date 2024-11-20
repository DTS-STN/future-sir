import { z, ZodIssueCode } from 'zod';

import { authentication } from '~/.server/environment/authentication';
import { buildinfo } from '~/.server/environment/buildinfo';
import { features } from '~/.server/environment/features';
import { logging } from '~/.server/environment/logging';
import { redis } from '~/.server/environment/redis';
import { session } from '~/.server/environment/session';
import { telemetry } from '~/.server/environment/telemetry';
import { getLogger } from '~/.server/logging';
import { asBoolean, asNumber, preprocess } from '~/utils/validation-utils';

const log = getLogger('environment');

export type ClientEnvironment = Readonly<z.infer<typeof client>>;
export type ServerEnvironment = Readonly<z.infer<typeof server>>;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const client = z
  .object({
    I18NEXT_DEBUG: asBoolean(z.string().default('false')),
    isProduction: z.boolean(),
  })
  .merge(buildinfo);

/**
 * Server-side environment variables.
 * Also includes all client-side variables.
 */
const server = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    PORT: asNumber(z.string().default('3000')).pipe(z.number().min(0)),
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
 * Reads and validates client environment variables.
 *
 * This function retrieves environment variables from the `process.env` object and validates them
 * using a Zod schema. The schema ensures type safety and defines default values for some variables.
 */
export function getClientEnvironment(): ClientEnvironment {
  const processed = preprocess(process.env);
  const isProduction = processed.NODE_ENV === 'production';
  return client.parse({ ...processed, isProduction });
}

/**
 * Reads and validates server environment variables.
 *
 * This function retrieves environment variables from the `process.env` object and validates them
 * using a Zod schema. The schema ensures type safety and defines default values for some variables.
 */
export function getServerEnvironment(): ServerEnvironment {
  const processed = preprocess(process.env);
  const isProduction = processed.NODE_ENV === 'production';
  return server.parse({ ...processed, isProduction });
}

/**
 * Logs a warning if the check evaluates to true.
 * Always returns true so it can be used in a zod refine() function.
 */
function warn(check: boolean, message: string): true {
  return check && log.warn(message), true;
}
