import { z, ZodIssueCode } from 'zod';

import { authentication, defaults as authenticationDefaults } from '~/.server/environment/authentication';
import { buildinfo, defaults as buildinfoDefaults } from '~/.server/environment/buildinfo';
import { features, defaults as featuresDefaults } from '~/.server/environment/features';
import { logging, defaults as loggingDefaults } from '~/.server/environment/logging';
import { redis, defaults as redisDefaults } from '~/.server/environment/redis';
import { session, defaults as sessionDefaults } from '~/.server/environment/session';
import { telemetry, defaults as telemetryDefaults } from '~/.server/environment/telemetry';
import { LogFactory } from '~/.server/logging';
import * as ValidationUtils from '~/utils/validation-utils';

const log = LogFactory.getLogger('environment');

export type ClientEnvironment = Readonly<z.infer<typeof client>>;
export type ServerEnvironment = Readonly<z.infer<typeof server>>;

export const clientDefaults = {
  I18NEXT_DEBUG: 'false',
  ...buildinfoDefaults,
} as const;

export const serverDefaults = {
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
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const client = z
  .object({
    I18NEXT_DEBUG: ValidationUtils.asBoolean(z.string().default(clientDefaults.I18NEXT_DEBUG)),
    isProduction: z.boolean(),
  })
  .merge(buildinfo);

/**
 * Server-side environment variables.
 * Also includes all client-side variables.
 */
const server = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default(serverDefaults.NODE_ENV),
    PORT: ValidationUtils.asNumber(z.string().default(serverDefaults.PORT)).pipe(z.number().min(0)),
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
  const processed = ValidationUtils.preprocess(process.env);
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
  const processed = ValidationUtils.preprocess(process.env);
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
