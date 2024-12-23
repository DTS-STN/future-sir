import { Duration, Redacted } from 'effect';
import Redis from 'ioredis';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

/**
 * A holder for our singleton redis client instance.
 */
const clientHolder: { client?: Redis } = {};

/**
 * Retrieves the application's redis client instance.
 * If the client does not exist, it initializes a new one.
 */
export function getRedisClient() {
  return (clientHolder.client ??= createRedisClient());
}

/**
 * Creates a new Redis client and sets up logging for connection and error events.
 */
function createRedisClient(): Redis {
  log.info('Creating new redis client');

  const { REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT } = serverEnvironment;

  return new Redis(getRedisConfig())
    .on('connect', () => log.info('Connected to %s://%s:%s/', REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT))
    .on('error', (error) => log.error('Redis client error: %s', error.message));
}

/**
 * Constructs the configuration object for the Redis client based on the server environment.
 */
function getRedisConfig() {
  const {
    REDIS_COMMAND_TIMEOUT_SECONDS, //
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_SENTINEL_MASTER_NAME,
    REDIS_USERNAME,
  } = serverEnvironment;

  const redisPassword = Redacted.value(REDIS_PASSWORD);
  const redisCommandTimeout = Duration.toMillis(Duration.seconds(REDIS_COMMAND_TIMEOUT_SECONDS));

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
