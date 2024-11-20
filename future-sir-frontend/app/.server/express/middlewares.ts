import type { RequestHandler } from 'express';
import sessionMiddleware from 'express-session';
import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import type { ServerEnvironment } from '~/.server/express/environment';
import { getLogger } from '~/.server/express/logging';
import { createMemoryStore, createRedisStore } from '~/.server/express/sessions';

const log = getLogger('middleware');

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
 */
export function security(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns: string[] = [];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding security headers to response: [%s]', request.path);
      return next();
    }

    log.trace('Adding nonce to response');
    response.locals.nonce = randomUUID();

    const contentSecurityPolicy = [
      `base-uri 'none'`,
      `default-src 'none'`,
      `connect-src 'self'` + (environment.isProduction ? '' : ' ws://localhost:3001'),
      `font-src 'self' fonts.gstatic.com`,
      `form-action 'self'`,
      `frame-ancestors 'self'`,
      `frame-src 'self'`,
      `img-src 'self' https://www.canada.ca`,
      `object-src data:`,
      `script-src 'self' 'nonce-${response.locals.nonce}'`,
      `style-src 'self' fonts.googleapis.com`,
    ].join('; ');

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

    log.trace('Adding security headers to response');
    response.setHeader('Permissions-Policy', permissionsPolicy);
    response.setHeader('Content-Security-Policy', contentSecurityPolicy);
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
    SESSION_TYPE,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_PATH,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECRET,
    SESSION_COOKIE_SECURE,
    SESSION_EXPIRES_SECONDS,
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
      sameSite: SESSION_COOKIE_SAMESITE,
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
