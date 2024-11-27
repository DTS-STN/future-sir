import RedisStore from 'connect-redis';
import Redis from 'ioredis';

import { getLogger } from './logging.server.mjs';

/**
 * @typedef {ReturnType<import('./environment.server.mjs').getEnvironment>} Environment
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * Creates a Redis store for Express sessions.
 *
 * This function attempts to connect to a Redis server using the provided environment variables.
 * It implements a retry strategy with exponential backoff in case of connection failures.
 *
 * @param {Environment} environment - The environment object containing configuration values.
 *                                  - `env.REDIS_HOST` (string): The hostname or IP address of the Redis server.
 *                                  - `env.REDIS_PORT` (number): The port number of the Redis server.
 *                                  - `env.REDIS_PASSWORD` (string): The password for the Redis server (optional).
 *                                  - `env.SESSION_EXPIRES_SECONDS` (number): The session expiration time in seconds.
 *
 * @returns {RedisStore} A Redis store for Express sessions.
 * @throws {Error} If failed to connect to Redis after the maximum retries.
 */
export function createRedisStore(environment) {
  const log = getLogger('session.server.mjs');

  const { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, SESSION_EXPIRES_SECONDS, SESSION_MAX_RETRIES_PER_REQUEST } = environment;

  /**
   * @param {number} times
   */
  const retryStrategy = (times) => {
    // exponential backoff starting at 250ms to a maximum of 5s
    const retryAfter = Math.min(250 * Math.pow(2, times - 1), 5000);
    log.error('Could not connect to Redis (attempt #%s); retry in %s ms', times, retryAfter);
    return retryAfter;
  };

  const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: SESSION_MAX_RETRIES_PER_REQUEST,
    retryStrategy,
  });

  redisClient
    .on('connect', () => log.info('Connected to Redis server [%s]', `redis://${REDIS_HOST}:${REDIS_PORT}`))
    .on('error', (error) => log.error('Redis client error: %s', error.message));

  return new RedisStore({ client: redisClient, prefix: 'SESSION:', ttl: SESSION_EXPIRES_SECONDS });
}
