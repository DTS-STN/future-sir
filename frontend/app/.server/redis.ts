import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { singleton } from '~/.server/utils/instance-registry';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Retrieves the application's redis client instance.
 * If the client does not exist, it initializes a new one.
 */
export function getRedisClient(): Redis {
  return singleton('redisClient', () => {
    log.info('Creating new redis client');

    const { REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT } = serverEnvironment;

    return new Redis(getRedisConfig())
      .on('connect', () => log.info('Connected to %s://%s:%s/', REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT))
      .on('error', (error) => log.error('Redis client error: %s', error.message));
  });
}

/**
 * Constructs the configuration object for the Redis client based on the server environment.
 */
function getRedisConfig(): RedisOptions {
  const {
    REDIS_COMMAND_TIMEOUT_SECONDS, //
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_SENTINEL_MASTER_NAME,
    REDIS_USERNAME,
  } = serverEnvironment;

  const redisPassword = REDIS_PASSWORD?.value();
  const redisCommandTimeout = REDIS_COMMAND_TIMEOUT_SECONDS * 1000;

  const retryStrategy = (times: number): number => {
    // exponential backoff starting at 250ms to a maximum of 5s
    const retryIn = Math.min(250 * Math.pow(2, times - 1), 5000);
    log.error('Could not connect to Redis (attempt #%s); retry in %s ms', times, retryIn);
    return retryIn;
  };

  switch (serverEnvironment.REDIS_CONNECTION_TYPE) {
    case 'standalone': {
      log.debug('      configuring Redis client in standalone mode');
      return {
        host: REDIS_HOST,
        port: REDIS_PORT,
        username: REDIS_USERNAME,
        password: redisPassword,
        commandTimeout: redisCommandTimeout,
        retryStrategy,
      };
    }

    case 'sentinel': {
      log.debug('      configuring Redis client in sentinel mode');

      return {
        name: REDIS_SENTINEL_MASTER_NAME,
        sentinels: [{ host: REDIS_HOST, port: REDIS_PORT }],
        username: REDIS_USERNAME,
        password: redisPassword,
        commandTimeout: redisCommandTimeout,
        retryStrategy,
      };
    }
  }
}
