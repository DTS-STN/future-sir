// import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import sessionMiddleware, { MemoryStore } from 'express-session';
import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import type { Environment } from './environment.server';
import { getLogger } from './logging.server';
import { createRedisStore } from './redis.server';

const log = getLogger('middleware.server');

function shouldIgnore(ignorePatterns: string[], path: string): boolean {
  return ignorePatterns.some((entry) => minimatch(path, entry));
}

/**
 * Middleware to protect against Cross-Site Request Forgery (CSRF) attacks.
 *
 * Creates a CSRF token and stores it in the user's session. Validates the token on subsequent requests.
 *
 * @returns An Express middleware function.
 */
export function csrf(): RequestHandler {
  const ignorePatterns: string[] = [];

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
 * Configures Morgan logging middleware with appropriate format and filtering.
 *
 * @param environment
 * @returns An Express middleware function.
 */
export function morgan(environment: Environment): RequestHandler {
  const ignorePatterns: string[] = [];

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
 * @returns An Express middleware function.
 */
export function securityHeaders(): RequestHandler {
  const ignorePatterns: string[] = [];

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
 * @param The environment configuration.
 * @returns An Express middleware function.
 */
export function session(environment: Environment): RequestHandler {
  const ignorePatterns: string[] = [];

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
    const isBot = isbot(request.headers['user-agent']);

    if (isBot || shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping session: [%s] (bot: %s)', request.path, isBot);
      return next();
    }

    return middleware(request, response, next);
  };
}
