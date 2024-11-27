// import { randomUUID } from 'node:crypto';
import sessionMiddleware, { MemoryStore } from 'express-session';
import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import { getLogger } from './logging.server.mjs';
import { createRedisStore } from './redis.server.mjs';

/**
 * @typedef {ReturnType<import('./environment.server.mjs').getEnvironment>} Environment
 * @typedef {import('express').RequestHandler} RequestHandler
 */

const log = getLogger('middleware.server.mjs');

/**
 * Checks if a given path should be ignored based on a list of ignore patterns.
 *
 * @param {string[]} ignorePatterns - An array of glob patterns to match against the path.
 * @param {string} path - The path to check.
 * @returns {boolean} - True if the path should be ignored, false otherwise.
 */
function shouldIgnore(ignorePatterns, path) {
  return ignorePatterns.some((entry) => minimatch(path, entry));
}

/**
 * Middleware to protect against Cross-Site Request Forgery (CSRF) attacks.
 *
 * Creates a CSRF token and stores it in the user's session. Validates the token on subsequent requests.
 *
 * @returns {RequestHandler} An Express middleware function.
 */
export function csrf() {
  /** @type string[] */
  const ignorePatterns = [];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping CSRF protection: [%s]', request.path);
      return next();
    }

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      log.trace('Non-mutative operation detected; skipping CSRF token validation');
      return next();
    }

    log.debug('Mutative operation detected; performing CSRF token validation');

    if (!request.session) {
      log.warn('No session detected during CSRF token validation; responding with a 403 status code');
      response.status(403);
      throw new Error('An http session is required to perform CSRF validation');
    }

    // create a new session csrf token if required
    request.session.csrfToken ??= randomUUID();
    response.locals.csrfToken = request.session.csrfToken;

    const csrfToken =
      request.body['_csrf'] ?? //
      request.query['_csrf'] ??
      request.headers['x-csrf-token'];

    if (!csrfToken || csrfToken !== request.session.csrfToken) {
      log.warn('Invalid CSRF token detected; responding with a 403 status code');
      response.status(403);
      throw new Error('CSRF token validation failed: invalid token');
    }

    next();
  };
}

/**
 *
 * Adds a nonce to the response. Can be used to help prevent cross-site scripting (XSS) attacks.
 *
 * @returns {RequestHandler} An Express middleware function.
 */
export function nonce() {
  /** @type {string[]} */
  const ignorePatterns = [];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding nonce to response: [%s]', request.path);
      return next();
    }

    log.trace('Adding nonce to response');
    response.locals.nonce = randomUUID();

    next();
  };
}

/**
 * Configures a logging middleware with appropriate format and filtering.
 *
 * @param {Environment} environment
 * @returns {RequestHandler} An Express middleware function.
 */
export function logging(environment) {
  /** @type string[] */
  const ignorePatterns = [];

  const logFormat = environment.isProduction ? 'tiny' : 'dev';

  const middleware = morganMiddleware(logFormat, {
    stream: { write: (msg) => log.audit(msg.trim()) },
  });

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) return next();
    return middleware(request, response, next);
  };
}

/**
 * Sets various security headers to protect the application.
 *
 * @returns {RequestHandler} An Express middleware function.
 */
export function securityHeaders() {
  /** @type {string[]} */
  const ignorePatterns = [];

  const permissionsPolicy = [
    'camera=()',
    'display-capture=()',
    'fullscreen=()',
    'geolocation=()',
    'interest-cohort=()',
    'microphone=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
  ].join(', ');

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding security headers to response: [%s]', request.path);
      return next();
    }

    log.trace('Adding security headers to response');
    response.setHeader('Permissions-Policy', permissionsPolicy);
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Server', 'webserver');
    response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'deny');
    next();
  };
}

/**
 * Configures session middleware, optionally skipping it for bots and specific paths.
 *
 * @param {Environment} environment The environment configuration.
 * @returns {RequestHandler} An Express middleware function.
 */
export function session(environment) {
  /** @type string[] */
  const ignorePatterns = [];

  const {
    isProduction,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_PATH,
    SESSION_COOKIE_SECRET,
    SESSION_EXPIRES_SECONDS,
    SESSION_STORAGE_TYPE,
  } = environment;

  const sessionStore =
    SESSION_STORAGE_TYPE === 'redis' //
      ? createRedisStore(environment)
      : new MemoryStore();

  const middleware = sessionMiddleware({
    store: sessionStore,
    name: SESSION_COOKIE_NAME,
    secret: [SESSION_COOKIE_SECRET],
    genid: () => randomUUID(),
    proxy: true,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      domain: SESSION_COOKIE_DOMAIN,
      path: SESSION_COOKIE_PATH,
      secure: isProduction,
      httpOnly: true,
      maxAge: SESSION_EXPIRES_SECONDS * 1000,
      sameSite: 'lax',
    },
  });

  return (request, response, next) => {
    const isBot = isbot(request.headers?.['user-agent']);

    if (isBot || shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping session: [%s] (bot: %s)', request.path, isBot);
      return next();
    }

    return middleware(request, response, next);
  };
}
