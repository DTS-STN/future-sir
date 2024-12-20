import { RedisStore } from 'connect-redis';
import { Duration, Redacted } from 'effect';
import { MemoryStore } from 'express-session';
import Redis from 'ioredis';
import { setInterval } from 'node:timers';

import type { ServerEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Creates a memory store for Express sessions.
 * This function creates a new MemoryStore instance and sets up a timer to periodically purge expired sessions.
 *
 * @returns A MemoryStore instance.
 */
export function createMemoryStore(): MemoryStore {
  log.info('      initializing new memory session store');
  const memoryStore = new MemoryStore();

  log.info('      registering automated session purger (running every 60 seconds)');
  setInterval(() => purgeExpiredSessions(memoryStore), 60_000);

  return memoryStore;
}

/**
 * Creates a Redis store for Express sessions.
 *
 * This function attempts to connect to a Redis server using the provided environment variables.
 * It implements a retry strategy with exponential backoff in case of connection failures.
 *
 * @param  environment
 *   - The environment object containing configuration values.
 *   - `env.REDIS_HOST` (string): The hostname or IP address of the Redis server.
 *   - `env.REDIS_PORT` (number): The port number of the Redis server.
 *   - `env.REDIS_PASSWORD` (string): The password for the Redis server (optional).
 *   - `env.SESSION_EXPIRES_SECONDS` (number): The session expiration time in seconds.
 *
 * @throws {Error} If failed to connect to Redis after the maximum retries.
 */
export function createRedisStore(environment: ServerEnvironment): RedisStore {
  log.info('      initializing new Redis session store');
  const { REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT, SESSION_EXPIRES_SECONDS, SESSION_KEY_PREFIX } = environment;

  const redisClient = new Redis(getRedisConfig(environment))
    .on('connect', () => log.info('Connected to %s://%s:%s/', REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT))
    .on('error', (error) => log.error('Redis client error: %s', error.message));

  return new RedisStore({
    client: redisClient,
    prefix: SESSION_KEY_PREFIX,
    // The Redis TTL is set to the session expiration
    // time, plus 5% to allow for clock drift
    ttl: SESSION_EXPIRES_SECONDS * 1.05,
  });
}

function getRedisConfig(environment: ServerEnvironment) {
  const {
    REDIS_COMMAND_TIMEOUT_SECONDS, //
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_SENTINEL_MASTER_NAME,
    REDIS_USERNAME,
  } = environment;

  const redisPassword = Redacted.value(REDIS_PASSWORD);
  const redisCommandTimeout = Duration.toMillis(Duration.seconds(REDIS_COMMAND_TIMEOUT_SECONDS));

  const retryStrategy = (times: number): number => {
    // exponential backoff starting at 250ms to a maximum of 5s
    const retryIn = Math.min(250 * Math.pow(2, times - 1), 5000);
    log.error('Could not connect to Redis (attempt #%s); retry in %s ms', times, retryIn);
    return retryIn;
  };

  switch (environment.REDIS_CONNECTION_TYPE) {
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

/**
 * Purges expired sessions from a MemoryStore.
 * This function iterates through all sessions in the store and removes those that have expired.
 *
 * @param memoryStore - The MemoryStore instance to purge sessions from.
 */
function purgeExpiredSessions(memoryStore: MemoryStore): void {
  log.trace('Purging expired sessions');

  const isPast = (date: Date): boolean => date.getTime() < Date.now();

  memoryStore.all((error, sessions) => {
    if (sessions) {
      const sessionEntries = Object.entries(sessions);
      log.trace('%s sessions in session store', Object.keys(sessions).length);

      sessionEntries.forEach(([sessionId, sessionData]) => {
        // express-session adds the cookie data to the session
        // so we can use this to check when the session is due to expire
        const expiresAt = sessionData.cookie.expires;

        log.trace('Checking session %s (expires at %s)', sessionId, expiresAt);
        if (expiresAt && isPast(new Date(expiresAt))) {
          log.trace('Purging expired session %s', sessionId);
          memoryStore.destroy(sessionId);
        }
      });
    }
  });
}
