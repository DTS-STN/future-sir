import compression from 'compression';
import express from 'express';
import type { AddressInfo } from 'node:net';
import sourceMapSupport from 'source-map-support';

import { globalErrorHandler, remixRequestHandler } from './request-handlers';
import { getClientEnvironment, getServerEnvironment } from '~/.server/express/environment';
import { getLogger, remapConsoleLoggers } from '~/.server/express/logging';
import { logging, securityHeaders, session } from '~/.server/express/middlewares';
import { createViteDevServer } from '~/.server/express/vite';

const log = getLogger('server');

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
  app.use('/locales', express.static('./public/locales', { maxAge: '1m' }));
  log.info('      ✓ caching remaining static content for 1h');
  app.use(express.static('./public', { maxAge: '1h' }));
}

log.info('    ✓ security headers middleware');
app.use(securityHeaders(serverEnvironment));

log.info('    ✓ session middleware (%s)', serverEnvironment.SESSION_TYPE);
app.use(session(serverEnvironment));

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering react-router request handler');
app.all('*', remixRequestHandler(clientEnvironment, serverEnvironment, viteDevServer));

log.info('  ✓ registering global error handler');
app.use(globalErrorHandler(serverEnvironment));

log.info('Server initialization complete');
const server = app.listen(serverEnvironment.PORT);
log.info('Listening on http://localhost:%s/', (server.address() as AddressInfo).port);
