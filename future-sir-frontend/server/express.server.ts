import { createRequestHandler } from '@react-router/express';

import compression from 'compression';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sourceMapSupport from 'source-map-support';

import { getEnvironment } from './environment.server';
import { getLogger, remapConsoleLoggers } from './logging.server';
import { csrf, morgan, securityHeaders, session } from './middleware.server';
import { createViteDevServer } from './vite.server';

const log = getLogger('express.server');

// this is defined as a separate const to trick typescript
// into letting us import a build file of unknown type
const buildFile = '../build/server/index.js';

log.info('Remapping console loggers to winston loggers...');
remapConsoleLoggers();

log.info('Installing source map support');
sourceMapSupport.install();

log.info('Validating runtime environment...');
const environment = getEnvironment();

log.info('Starting express server...');
log.info(`Initializing %s mode express server...`, environment.NODE_ENV);
const viteDevServer = await createViteDevServer(environment);
const app = express();

log.info('  ✓ disabling X-Powered-By response header');
app.disable('x-powered-by');

log.info('  ✓ enabling reverse proxy support');
app.set('trust proxy', true);

log.info('  ✓ configuring express middlewares...');

log.info('    ✓ compression');
app.use(compression());

log.info('    ✓ morgan');
app.use(morgan(environment));

if (environment.isProduction) {
  log.info('    ✓ static assets (production)');
  log.info('      ✓ caching /assets for 1y');
  app.use('/assets', express.static('./build/client/assets', { immutable: true, maxAge: '1y' }));
  log.info('      ✓ caching /locales for 1d');
  app.use('/locales', express.static('./build/client/locales', { maxAge: '1d' }));
  log.info('      ✓ caching remaining static content for 1y');
  app.use(express.static('./build/client', { maxAge: '1y' }));
} else {
  log.info('    ✓ static assets (development)');
  log.info('      ✓ caching /locales for 1m');
  app.use('/locales', express.static('public/locales', { maxAge: '1m' }));
  log.info('      ✓ caching remaining static content for 1h');
  app.use(express.static('./build/client', { maxAge: '1h' }));
}

log.info('    ✓ security headers');
app.use(securityHeaders());

log.info('    ✓ express urlencode middleware');
app.use(express.urlencoded({ extended: true }));

log.info('    ✓ session middleware (%s)', environment.SESSION_STORAGE_TYPE);
app.use(session(environment));

log.info('    ✓ CSRF token middleware');
app.use(csrf());

if (viteDevServer) {
  log.info('    ✓ vite dev server');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering react-router request handler');
app.all(
  '*',
  createRequestHandler({
    mode: environment.NODE_ENV,
    getLoadContext: (request) => ({
      environment: environment,
      getLogger: getLogger,
      session: request.session,
    }),
    build: viteDevServer //
      ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
      : () => import(buildFile),
  }),
);

/**
 * This is the error handler middleware for the express application.
 * It must be added using `app.use` after all other middleware and
 * routes have been defined. Otherwise, it will never be called.
 */
app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  log.error(error);

  if (response.headersSent) {
    return next(error);
  }

  const status = response.statusCode;

  const filename =
    status === 403 //
      ? '../public/errors/403.html'
      : '../public/errors/500.html';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, filename);

  response.status(status).sendFile(filePath, (dispatchError) => {
    log.error(dispatchError);
    response.status(500).send('Internal Server Error');
  });
});

log.info('Server initialization complete');
app.listen(environment.SERVER_PORT, () => log.info(`Listening on http://localhost:${environment.SERVER_PORT}/`));
