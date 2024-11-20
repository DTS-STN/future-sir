import RedisStore from 'connect-redis';
import session, { MemoryStore } from 'express-session';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

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
 * @param {Environment} env - The environment object containing configuration values.
 *                          - `env.REDIS_HOST` (string): The hostname or IP address of the Redis server.
 *                          - `env.REDIS_PORT` (number): The port number of the Redis server.
 *                          - `env.REDIS_PASSWORD` (string): The password for the Redis server (optional).
 *                          - `env.REDIS_CONNECT_MAX_RETRIES` (number): The maximum number of connection retries.
 *                          - `env.SESSION_EXPIRES_SECONDS` (number): The session expiration time in seconds.
 *
 * @returns {RedisStore} A Redis store for Express sessions.
 * @throws {Error} If failed to connect to Redis after the maximum retries.
 */
function createRedisStore(env) {
  const log = getLogger('session.server.mjs');

  /**
   * @param {number} times
   */
  const retryStrategy = (times) => {
    const backoff = Math.min(100 * Math.pow(2, times - 1), 10000);

    if (times <= env.REDIS_CONNECT_MAX_RETRIES) {
      log.error('Could not connect to Redis (attempt %s/%s); retry in %s ms', times, env.REDIS_CONNECT_MAX_RETRIES, backoff);
      return backoff;
    }

    throw new Error(`Failed to connect to Redis after ${env.REDIS_CONNECT_MAX_RETRIES} attempts`);
  };

  const redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    retryStrategy,
  });

  redisClient
    .on('connect', () => log.info('Connected to Redis server [%s]', `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`))
    .on('error', (error) => log.error('Redis client error: %s', error.message));

  return new RedisStore({ client: redisClient, prefix: 'SESSION:', ttl: env.SESSION_EXPIRES_SECONDS });
}

/**
 * Creates an Express session middleware based on the environment configuration.
 *
 * This function chooses between a Redis store or a MemoryStore based on the
 * `SESSION_STORAGE_TYPE` environment variable. It also configures various session options
 * like secret, rolling updates, cookie settings, etc.
 *
 * @param {Environment} env - The environment object containing configuration values.
 *                          - `env.SESSION_STORAGE_TYPE` (string): The session storage type ('redis' or 'memory').
 *                          - `env.SESSION_COOKIE_NAME` (string): The name of the session cookie.
 *                          - `env.SESSION_COOKIE_SECRET` (string): The secret key used for session signing.
 *                          - `env.isProduction` (boolean): A flag indicating if the environment is production.
 *                          - `env.SESSION_COOKIE_DOMAIN` (string): The domain for the session cookie (optional).
 *                          - `env.SESSION_COOKIE_PATH` (string): The path for the session cookie (optional).
 *                          - `env.SESSION_EXPIRES_SECONDS` (number): The session expiration time in seconds.
 *
 * @returns {RequestHandler} An Express session middleware request handler.
 */
export function createSessionMiddleware(env) {
  const generateId = () => randomUUID();

  const sessionStore =
    env.SESSION_STORAGE_TYPE === 'redis' //
      ? createRedisStore(env)
      : new MemoryStore();

  return session({
    store: sessionStore,
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_COOKIE_SECRET,
    genid: generateId,
    proxy: true,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      domain: env.SESSION_COOKIE_DOMAIN,
      path: env.SESSION_COOKIE_PATH,
      secure: env.isProduction,
      httpOnly: true,
      maxAge: env.SESSION_EXPIRES_SECONDS * 1000,
      sameSite: 'lax',
    },
  });
}
