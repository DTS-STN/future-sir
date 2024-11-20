import { RedisStore } from 'connect-redis';
import { Redacted } from 'effect';
import { MemoryStore } from 'express-session';
import Redis from 'ioredis';
import { setInterval } from 'node:timers';

import type { ServerEnvironment } from '~/.server/environment';
import { getLogger } from '~/.server/logging';

const log = getLogger('session');

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
  const { REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT, SESSION_EXPIRES_SECONDS } = environment;

  const redisClient = new Redis(getRedisConfig(environment))
    .on('connect', () => log.info('Connected to %s://%s:%s/', REDIS_CONNECTION_TYPE, REDIS_HOST, REDIS_PORT))
    .on('error', (error) => log.error('Redis client error: %s', error.message));

  return new RedisStore({
    client: redisClient,
    prefix: 'SESSION:',
    // The Redis TTL is set to the session expiration
    // time, plus 5% to allow for clock drift
    ttl: SESSION_EXPIRES_SECONDS * 1.05,
  });
}

function getRedisConfig(environment: ServerEnvironment) {
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
        host: environment.REDIS_HOST,
        port: environment.REDIS_PORT,
        username: environment.REDIS_USERNAME,
        password: Redacted.value(environment.REDIS_PASSWORD),
        commandTimeout: environment.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        retryStrategy,
      };
    }

    case 'sentinel': {
      log.debug('      configuring Redis client in sentinel mode');

      return {
        name: environment.REDIS_SENTINEL_MASTER_NAME,
        sentinels: [
          {
            host: environment.REDIS_HOST,
            port: environment.REDIS_PORT,
          },
        ],
        username: environment.REDIS_USERNAME,
        password: Redacted.value(environment.REDIS_PASSWORD),
        commandTimeout: environment.REDIS_COMMAND_TIMEOUT_SECONDS * 1000,
        retryStrategy,
      };
    }
  }
}

/**
 * Checks if the first date is before the second date.
 *
 * @param date1 - The first date to compare.
 * @param date2 - The second date to compare.
 * @returns  `true` if `date1` is before `date2`.
 */
function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

/**
 * Purges expired sessions from a MemoryStore.
 * This function iterates through all sessions in the store and removes those that have expired.
 *
 * @param memoryStore - The MemoryStore instance to purge sessions from.
 */
function purgeExpiredSessions(memoryStore: MemoryStore): void {
  log.trace('Purging expired sessions');

  memoryStore.all((error, sessions) => {
    if (sessions) {
      const now = new Date();
      const sessionEntries = Object.entries(sessions);
      log.trace('%s sessions in session store', Object.keys(sessions).length);

      sessionEntries.forEach(([sessionId, sessionData]) => {
        // express-session adds the cookie data to the session
        // so we can use this to check when the session is due to expire
        const expiresAt = sessionData.cookie.expires;

        log.trace('Checking session %s (expires at %s)', sessionId, expiresAt);
        if (expiresAt && isBefore(new Date(expiresAt), now)) {
          log.trace('Purging expired session %s', sessionId);
          memoryStore.destroy(sessionId);
        }
      });
    }
  });
}
