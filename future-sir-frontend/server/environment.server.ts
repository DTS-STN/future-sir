import { z } from 'zod';

import { getLogger } from './logging.server';

/**
 * Parses a string to a number.
 *
 * This function uses `parseInt` to convert the provided string to a number.
 *
 * @param str The string to be parsed.
 * @returns The parsed number, or NaN if the conversion fails.
 */
function toNumber(str: string): number {
  return parseInt(str);
}

/**
 * Wraps a Zod schema to allow empty strings to be converted to undefined.
 *
 * This function takes a Zod schema and returns a new schema that preprocesses
 * any empty string value to undefined before applying the original schema validation.
 *
 * @template T The type of the Zod schema.
 * @param schema The Zod schema to be wrapped.
 * @returns A Zod schema that can produce the original output type or undefined.
 */
function toUndefined<T extends z.ZodTypeAny>(schema: T): z.ZodEffects<T> {
  return z.preprocess((value) => (value === '' ? undefined : value), schema);
}

/**
 * Defines a constant object representing logging levels.
 *
 * This object provides a mapping between string names and their corresponding integer values for logging levels.
 */
export const logLevels = { error: 0, warn: 1, info: 2, audit: 3, debug: 4, trace: 5 } as const;

/**
 * Reads and validates environment variables.
 *
 * This function retrieves environment variables from the `process.env` object and validates them
 * using a Zod schema. The schema ensures type safety and defines default values for some variables.
 */
export function getEnvironment() {
  const log = getLogger('environment.server.mjs');

  const environmentSchema = z.object({
    NODE_ENV: toUndefined(z.enum(['production', 'development', 'test']).default('development')),
    LOG_LEVEL: toUndefined(z.string().default('info')).refine((val) => Object.keys(logLevels).includes(val)),
    SERVER_PORT: toUndefined(z.string().default('3000').transform(toNumber)),

    // redis config
    REDIS_HOST: toUndefined(z.string().default('localhost')),
    REDIS_PORT: toUndefined(z.string().default('6379')).transform(toNumber),
    REDIS_PASSWORD: toUndefined(z.string().default('password')),
    REDIS_EXPIRES_SECONDS: toUndefined(z.string().default('3600')).transform(toNumber),
    REDIS_COMMAND_TIMEOUT_SECONDS: toUndefined(z.string().default('1000')).transform(toNumber),

    // session config
    SESSION_COOKIE_DOMAIN: toUndefined(z.string().default('localhost')),
    SESSION_COOKIE_NAME: toUndefined(z.string().default('__FSIR||session')),
    SESSION_COOKIE_PATH: toUndefined(z.string().default('/')),
    SESSION_COOKIE_SECRET: toUndefined(z.string().default('secret')),
    SESSION_EXPIRES_SECONDS: toUndefined(z.string().default('3600')).transform(toNumber),
    SESSION_STORAGE_TYPE: toUndefined(z.enum(['memory', 'redis']).default('memory')),
  });

  const environment = environmentSchema.parse(process.env);

  log.info('Successfully validated server runtime environment: %o', environment);

  const isProduction = environment.NODE_ENV === 'production';

  return { ...environment, isProduction };
}

export type Environment = ReturnType<typeof getEnvironment>;
