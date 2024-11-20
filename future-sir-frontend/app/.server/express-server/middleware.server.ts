import type { RequestHandler } from 'express';
import sessionMiddleware from 'express-session';
import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import type { ServerEnvironment } from './environment.server';
import { getLogger } from './logging.server';
import { createMemoryStore, createRedisStore } from './session.server';

const log = getLogger('middleware.server');

/**
 * Checks if a given path should be ignored based on a list of ignore patterns.
 *
 * @param ignorePatterns - An array of glob patterns to match against the path.
 * @param path - The path to check.
 * @returns - True if the path should be ignored, false otherwise.
 */
function shouldIgnore(ignorePatterns: string[], path: string): boolean {
  return ignorePatterns.some((entry) => minimatch(path, entry));
}

/**
 * Middleware to protect against Cross-Site Request Forgery (CSRF) attacks.
 * Creates a CSRF token and stores it in the user's session. Validates the token on subsequent requests.
 */
export function csrf(): RequestHandler {
  const ignorePatterns: string[] = [];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping CSRF protection: [%s]', request.path);
      return next();
    }

    // create a new session csrf token if required
    if (!request.session.csrfToken) {
      log.trace('Creating new CSRF token for session [%s]', request.session.id);
      request.session.csrfToken = randomUUID();
    }

    response.locals.csrfToken = request.session.csrfToken;

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      log.trace('Non-mutative operation detected; skipping CSRF token validation');
      return next();
    }

    log.debug('Mutative operation detected; performing CSRF token validation');

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
 */
export function nonce(): RequestHandler {
  const ignorePatterns: string[] = [];

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
 */
export function logging(environment: ServerEnvironment): RequestHandler {
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
 * @returns {RequestHandler} An Express middleware function.
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
 */
export function session(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns: string[] = [];

  const {
    isProduction,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_PATH,
    SESSION_COOKIE_SECRET,
    SESSION_COOKIE_SECURE,
    SESSION_EXPIRES_SECONDS,
    SESSION_TYPE,
  } = environment;

  const sessionStore =
    SESSION_TYPE === 'redis' //
      ? createRedisStore(environment)
      : createMemoryStore();

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
      secure: SESSION_COOKIE_SECURE ? isProduction : false,
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
