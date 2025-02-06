import { Redacted } from 'effect';
import * as v from 'valibot';

import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

export type Redis = Readonly<v.InferOutput<typeof redis>>;

export const defaults = {
  REDIS_COMMAND_TIMEOUT_SECONDS: '1',
  REDIS_CONNECTION_TYPE: 'standalone',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
} as const;

export const redis = v.pipe(
  v.object({
    REDIS_CONNECTION_TYPE: v.optional(v.picklist(['sentinel', 'standalone']), defaults.REDIS_CONNECTION_TYPE),
    REDIS_HOST: v.optional(v.string(), defaults.REDIS_HOST),
    REDIS_PORT: v.optional(v.pipe(stringToIntegerSchema(), v.minValue(0)), defaults.REDIS_PORT),
    REDIS_USERNAME: v.optional(v.string()),
    REDIS_PASSWORD: v.optional(v.pipe(v.string(), v.transform(Redacted.make))),
    REDIS_SENTINEL_MASTER_NAME: v.optional(v.string()),
    REDIS_COMMAND_TIMEOUT_SECONDS: v.optional(
      v.pipe(stringToIntegerSchema(), v.minValue(0)),
      defaults.REDIS_COMMAND_TIMEOUT_SECONDS,
    ),
  }),
  v.forward(
    v.partialCheck(
      [['REDIS_CONNECTION_TYPE'], ['REDIS_SENTINEL_MASTER_NAME']],
      (input) => {
        // Check if the connection type is sentinel
        const isSentinel = input.REDIS_CONNECTION_TYPE === 'sentinel';

        // If the connection type is not sentinel, we don't need to check for the master name
        if (!isSentinel) {
          return true;
        }

        // If the connection type is sentinel, we need to check for the master name
        const hasMasterName = input.REDIS_SENTINEL_MASTER_NAME !== undefined;
        return hasMasterName;
      },
      'REDIS_SENTINEL_MASTER_NAME is required when REDIS_CONNECTION_TYPE is sentinel',
    ),
    ['REDIS_SENTINEL_MASTER_NAME'],
  ),
);
