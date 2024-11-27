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
 *                                  - `env.REDIS_CONNECT_MAX_RETRIES` (number): The maximum number of connection retries.
 *                                  - `env.SESSION_EXPIRES_SECONDS` (number): The session expiration time in seconds.
 *
 * @returns {RedisStore} A Redis store for Express sessions.
 * @throws {Error} If failed to connect to Redis after the maximum retries.
 */
export function createRedisStore(environment) {
  const log = getLogger('session.server.mjs');

  const { REDIS_CONNECT_MAX_RETRIES, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, SESSION_EXPIRES_SECONDS } = environment;

  /**
   * @param {number} times
   */
  const retryStrategy = (times) => {
    const backoff = Math.min(100 * Math.pow(2, times - 1), 10000);

    if (times <= REDIS_CONNECT_MAX_RETRIES) {
      log.error('Could not connect to Redis (attempt %s/%s); retry in %s ms', times, REDIS_CONNECT_MAX_RETRIES, backoff);
      return backoff;
    }

    throw new Error(`Failed to connect to Redis after ${REDIS_CONNECT_MAX_RETRIES} attempts`);
  };

  const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    retryStrategy,
  });

  redisClient
    .on('connect', () => log.info('Connected to Redis server [%s]', `redis://${REDIS_HOST}:${REDIS_PORT}`))
    .on('error', (error) => log.error('Redis client error: %s', error.message));

  return new RedisStore({ client: redisClient, prefix: 'SESSION:', ttl: SESSION_EXPIRES_SECONDS });
}
