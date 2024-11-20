import { createRequestHandler } from '@react-router/express';

import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import sourceMapSupport from 'source-map-support';

import { getClientEnvironment, getServerEnvironment } from './environment.server';
import { getLogger, remapConsoleLoggers } from './logging.server';
import { csrf, logging, securityHeaders, session } from './middleware.server';
import { createViteDevServer } from './vite.server';

const log = getLogger('express.server');

log.info('Remapping console loggers to winston loggers...');
remapConsoleLoggers();

log.info('Installing source map support');
sourceMapSupport.install();

log.info('Validating runtime environment...');
const clientEnvironment = getClientEnvironment();
const serverEnvironment = getServerEnvironment();

log.info('Runtime environment validation passed; adding environment to globalThis.__appEnvironment');
globalThis.__appEnvironment = serverEnvironment;

log.info('Starting express server...');
log.info(`Initializing %s mode express server...`, serverEnvironment.NODE_ENV);
const viteDevServer = await createViteDevServer(serverEnvironment);
const app = express();

log.info('  ✓ disabling X-Powered-By response header');
app.disable('x-powered-by');

log.info('  ✓ enabling reverse proxy support');
app.set('trust proxy', true);

log.info('  ✓ configuring express middlewares...');

log.info('    ✓ compression middleware');
app.use(compression());

log.info('    ✓ logging middleware');
app.use(logging(serverEnvironment));

if (serverEnvironment.isProduction) {
  log.info('    ✓ static assets middleware (production)');
  log.info('      ✓ caching /assets for 1y');
  app.use('/assets', express.static('./build/client/assets', { immutable: true, maxAge: '1y' }));
  log.info('      ✓ caching /locales for 1d');
  app.use('/locales', express.static('./build/client/locales', { maxAge: '1d' }));
  log.info('      ✓ caching remaining static content for 1y');
  app.use(express.static('./build/client', { maxAge: '1y' }));
} else {
  log.info('    ✓ static assets middleware (development)');
  log.info('      ✓ caching /locales for 1m');
  app.use('/locales', express.static('public/locales', { maxAge: '1m' }));
  log.info('      ✓ caching remaining static content for 1h');
  app.use(express.static('./build/client', { maxAge: '1h' }));
}

log.info('    ✓ security headers middleware');
app.use(securityHeaders(serverEnvironment));

log.info('    ✓ express urlencode middleware');
app.use(express.urlencoded({ extended: true }));

log.info('    ✓ session middleware (%s)', serverEnvironment.SESSION_TYPE);
app.use(session(serverEnvironment));

log.info('    ✓ CSRF token middleware');
app.use(csrf());

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering react-router request handler');

// dynamically declare the path to avoid static analysis errors 💩
const rrServerBuild = './server/index.js';

app.all(
  '*',
  createRequestHandler({
    mode: serverEnvironment.NODE_ENV,
    getLoadContext: (request, response) => ({
      csrfToken: response.locals.csrfToken,
      environment: {
        client: clientEnvironment,
        server: serverEnvironment,
      },
      logFactory: {
        getLogger: getLogger,
      },
      nonce: response.locals.nonce,
      session: request.session,
    }),
    build: viteDevServer //
      ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
      : () => import(rrServerBuild),
  }),
);

log.info('  ✓ registering global error handler');
app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  log.error(error);

  if (response.headersSent) {
    return next(error);
  }

  const rootDir = serverEnvironment.isProduction ? './client/' : '../../../public/';

  const errorFile =
    response.statusCode === 403 //
      ? rootDir + 'errors/403.html'
      : rootDir + 'errors/500.html';

  const errorFilePath = path.join(import.meta.dirname, errorFile);

  response.status(response.statusCode).sendFile(errorFilePath, (dispatchError: unknown) => {
    if (dispatchError) {
      log.error(dispatchError);
      response.status(500).send('Internal Server Error');
    }
  });
});

log.info('Server initialization complete');
const server = app.listen(serverEnvironment.PORT);
log.info('Listening on http://localhost:%s/', (server.address() as AddressInfo).port);
