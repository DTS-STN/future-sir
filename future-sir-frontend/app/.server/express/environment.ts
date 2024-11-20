import { z } from 'zod';

import { getLogger } from '~/.server/express/logging';

export type ClientEnvironment = Readonly<z.infer<typeof clientEnvironmentSchema>>;
export type ServerEnvironment = Readonly<z.infer<typeof serverEnvironmentSchema>>;

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Defines a constant object representing logging levels.
 * This object provides a mapping between string names and their corresponding integer values for logging levels.
 */
export const logLevels = { error: 0, warn: 1, info: 2, audit: 3, debug: 4, trace: 5 } as const;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const clientEnvironmentSchema = z.object({
  I18NEXT_DEBUG: z.string().default('false').transform(toBoolean),

  // properties derived in preprocess()
  isProduction: z.boolean(),
});

/**
 * Server-side environment variables. Includes client-side variables by extension.
 */
const serverEnvironmentSchema = clientEnvironmentSchema
  .extend({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    PORT: z.string().default('3000').transform(toNumber).pipe(z.number().min(0)),
    LOG_LEVEL: z
      .string()
      .default(isProduction ? 'info' : 'debug')
      .refine(isIn(logLevels)),

    // Feature flags
    ENABLE_DEVMODE_OIDC: z
      .string()
      .default(isProduction ? 'false' : 'true')
      .transform(toBoolean),

    // Authentication settings
    AUTH_DEFAULT_PROVIDER: z.enum(['azuread', 'local']).default(isProduction ? 'azuread' : 'local'),

    // Azure AD config
    AZUREAD_ISSUER_URL: z.string().optional(),
    AZUREAD_CLIENT_ID: z.string().optional(),
    AZUREAD_CLIENT_SECRET: z.string().optional(),

    // redis config
    REDIS_CONNECTION_TYPE: z.enum(['sentinel', 'standalone']).default('standalone'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379').transform(toNumber).pipe(z.number().min(0)),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_SENTINEL_MASTER_NAME: z.string().optional(/* when REDIS_CONNECTION_TYPE === standalone */),
    REDIS_COMMAND_TIMEOUT_SECONDS: z.string().default('1').transform(toNumber).pipe(z.number().min(0)),

    // session config
    SESSION_TYPE: z.enum(['memory', 'redis']).default('memory'),
    SESSION_COOKIE_DOMAIN: z.string().default('localhost'),
    SESSION_COOKIE_NAME: z.string().default('__FSIR||session'),
    SESSION_COOKIE_PATH: z.string().default('/'),
    SESSION_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('strict'),
    SESSION_COOKIE_SECRET: z.string().default('00000000-0000-0000-0000-000000000000').pipe(z.string().min(32)),
    SESSION_COOKIE_SECURE: z.string().default('true').transform(toBoolean),
    SESSION_EXPIRES_SECONDS: z.string().default('3600').transform(toNumber).pipe(z.number().min(0)),
  })
  .refine(({ NODE_ENV, ENABLE_DEVMODE_OIDC }) =>
    warn(
      () => NODE_ENV === 'production' && ENABLE_DEVMODE_OIDC === true,
      'Setting ENABLE_DEVMODE_OIDC=true is not recommended in production!',
    ),
  )
  .refine((data) => data.REDIS_CONNECTION_TYPE !== 'sentinel' || data.REDIS_SENTINEL_MASTER_NAME !== undefined, {
    message: 'REDIS_SENTINEL_MASTER_NAME is required when REDIS_CONNECTION_TYPE is sentinel',
  });

/**
 * Reads and validates client environment variables.
 *
 * This function retrieves environment variables from the `process.env` object and validates them
 * using a Zod schema. The schema ensures type safety and defines default values for some variables.
 */
export function getClientEnvironment(): ClientEnvironment {
  const log = getLogger('environment');

  const processed = preprocess(process.env);
  const environment = clientEnvironmentSchema.parse({ ...processed, isProduction: processed.NODE_ENV === 'production' });
  log.info('Successfully validated client runtime environment: %o', environment);

  return Object.freeze(environment);
}

/**
 * Reads and validates server environment variables.
 *
 * This function retrieves environment variables from the `process.env` object and validates them
 * using a Zod schema. The schema ensures type safety and defines default values for some variables.
 */
export function getServerEnvironment(): ServerEnvironment {
  const log = getLogger('environment');

  const processed = preprocess(process.env);
  const environment = serverEnvironmentSchema.parse({ ...processed, isProduction });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { AZUREAD_CLIENT_SECRET, REDIS_PASSWORD, SESSION_COOKIE_SECRET, ...sanitizedEnv } = environment;
  log.info('Successfully validated server runtime environment: %o', sanitizedEnv);

  return Object.freeze(environment);
}

function isIn(record: Record<string, unknown>) {
  return (val: string) => Object.keys(record).includes(val);
}

/**
 * Preprocesses environment variables.
 *
 * This function takes a NodeJS process environment object and returns a new object
 * with empty string values replaced with undefined. This is useful for handling optional
 * environment variables that may not be set.
 *
 * @param env - The NodeJS process environment object.
 * @returns A new object with empty string values replaced with undefined.
 */
function preprocess(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const processedEntries = Object.entries(env) //
    .map(([key, value]) => [key, value === '' ? undefined : value]);

  return Object.fromEntries(processedEntries);
}
/**
 * Parses a string to a boolean.
 */
function toBoolean(str: string): boolean {
  return str.toLowerCase() === 'true';
}

/**
 * Parses a string to a number.
 */
function toNumber(str: string): number {
  return parseInt(str);
}

/**
 * Logs a warning if the check evaluates to true.
 * Always returns true so it can be used in a zod refine() function.
 */
function warn(check: () => boolean, message: string): true {
  return check() && getLogger('environment').warn(message), true;
}
