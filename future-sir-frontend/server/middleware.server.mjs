import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import { getLogger } from './logging.server.mjs';
import { createSessionMiddleware } from './session.server.mjs';

/**
 * @typedef {ReturnType<import('./environment.server.mjs').getEnvironment>} Environment
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * Middleware to protect against Cross-Site Request Forgery (CSRF) attacks.
 *
 * Creates a CSRF token and stores it in the user's session. Validates the token on subsequent requests.
 *
 * @returns {RequestHandler} An Express middleware function.
 */
export function csrf() {
  const log = getLogger('middleware.server.mjs');

  return (request, response, next) => {
    if (request.session) {
      // create a new session csrf token if required
      request.session.csrfToken ??= randomUUID();

      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        log.debug('Mutative operation detected; performing CSRF token validation');
        const csrfToken = request.body['_csrf'] ?? request.query['_csrf'] ?? request.headers['x-csrf-token'];
        if (!csrfToken || csrfToken !== request.session.csrfToken) {
          log.audit('Invalid CSRF token detected; responding with a 403 status code');
          response.status(403).json({ error: 'Invalid CSRF token', message: 'CSRF token validation failed' });
          return;
        }
      }
    }

    next();
  };
}

/**
 * Configures Morgan logging middleware with appropriate format and filtering.
 *
 * @param {Environment} environment
 * @returns {RequestHandler} An Express middleware function.
 */
export function morgan(environment) {
  const log = getLogger('middleware.server.mjs');

  const format = environment.isProduction ? 'tiny' : 'dev';
  const loggingMidlewareIgnore = ['/api/readyz', '/__manifest'];

  return morganMiddleware(format, {
    stream: { write: (msg) => log.audit(msg.trim()) },
    skip: (request) => loggingMidlewareIgnore.some((entry) => minimatch(request.path, entry)),
  });
}

/**
 * Sets various security headers to protect the application.
 *
 * @returns {RequestHandler} An Express middleware function.
 */
export function securityHeaders() {
  const log = getLogger('middleware.server.mjs');

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
  const log = getLogger('middleware.server.mjs');

  const sessionMiddleware = createSessionMiddleware(environment);
  const sessionMiddlewareIgnore = ['**/api/**'];

  return (request, response, next) => {
    const isBot = isbot(request.headers?.['user-agent']);
    const ignore = sessionMiddlewareIgnore.some((entry) => minimatch(request.path, entry));
    if (isBot || ignore) log.debug('Skipping session initializing for path [%s]', request.path);
    return isBot || ignore ? next() : sessionMiddleware(request, response, next);
  };
}
