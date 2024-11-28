import { createRequestHandler } from '@react-router/express';

import compression from 'compression';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sourceMapSupport from 'source-map-support';

import { getClientEnvironment, getServerEnvironment } from './environment.server.mjs';
import { getLogger, remapConsoleLoggers } from './logging.server.mjs';
import { csrf, logging, nonce, securityHeaders, session } from './middleware.server.mjs';
import { createViteDevServer } from './vite.server.mjs';

const log = getLogger('express.server.mjs');

// this is defined as a separate const to trick typescript
// into letting us import a build file of unknown type
const buildFile = '../build/server/index.js';

log.info('Remapping console loggers to winston loggers...');
remapConsoleLoggers();

log.info('Installing source map support');
sourceMapSupport.install();

log.info('Validating runtime environment...');
const serverEnvironment = getServerEnvironment();
const clientEnvironment = getClientEnvironment();

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

log.info('    ✓ nonce middleware');
app.use(nonce());

log.info('    ✓ security headers middleware');
app.use(securityHeaders());

log.info('    ✓ express urlencode middleware');
app.use(express.urlencoded({ extended: true }));

log.info('    ✓ session middleware (%s)', serverEnvironment.SESSION_STORAGE_TYPE);
app.use(session(serverEnvironment));

log.info('    ✓ CSRF token middleware');
app.use(csrf());

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering react-router request handler');
app.all(
  '*',
  createRequestHandler({
    mode: serverEnvironment.NODE_ENV,
    getLoadContext: (request, response) => ({
      clientEnvironment: clientEnvironment,
      serverEnvironment: serverEnvironment,
      getLogger: getLogger,
      nonce: response.locals.nonce,
      session: request.session,
    }),
    build: viteDevServer //
      ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
      : () => import(buildFile),
  }),
);

log.info('  ✓ registering global error handler');
app.use(
  /** @type {import('express').ErrorRequestHandler} */
  (error, request, response, next) => {
    log.error(error);

    if (response.headersSent) {
      return next(error);
    }

    const statusCode = response.statusCode ?? 500;

    const filename =
      statusCode === 403 //
        ? '../public/errors/403.html'
        : '../public/errors/500.html';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, filename);

    response.status(statusCode).sendFile(filePath, (dispatchError) => {
      if (dispatchError) {
        log.error(dispatchError);
        response.status(500).send('Internal Server Error');
      }
    });
  },
);

log.info('Server initialization complete');
app.listen(serverEnvironment.SERVER_PORT, () => log.info(`Listening on http://localhost:${serverEnvironment.SERVER_PORT}/`));
