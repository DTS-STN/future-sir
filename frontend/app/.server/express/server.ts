import compression from 'compression';
import express from 'express';
import type { AddressInfo } from 'node:net';
import sourceMapSupport from 'source-map-support';

import { clientEnvironment, serverEnvironment } from '~/.server/environment';
import { globalErrorHandler, rrRequestHandler } from '~/.server/express/handlers';
import { logging, security, session, tracing } from '~/.server/express/middleware';
import { createViteDevServer } from '~/.server/express/vite';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

log.info('Installing source map support');
sourceMapSupport.install();

log.info('Runtime environment validation passed; adding client environment to globalThis.__appEnvironment');
globalThis.__appEnvironment = clientEnvironment;

log.info('Starting express server...');
log.info(`Initializing %s mode express server...`, serverEnvironment.NODE_ENV);
const viteDevServer = await createViteDevServer(serverEnvironment);
const app = express();

log.info('  ✓ disabling X-Powered-By response header');
app.disable('x-powered-by');

log.info('  ✓ enabling reverse proxy support');
app.set('trust proxy', true);

log.info('  ✓ configuring express middlewares...');

log.info('    ✓ tracing middleware');
app.use(tracing());

log.info('    ✓ compression middleware');
app.use(compression());

log.info('    ✓ logging middleware');
app.use(logging(serverEnvironment));

log.info('    ✓ security headers middleware');
app.use(security(serverEnvironment));

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

log.info('    ✓ session middleware (%s)', serverEnvironment.SESSION_TYPE);
app.use(session(serverEnvironment));

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering react-router request handler');
// In Express v5, the path route matching syntax has changed.
// The wildcard "*" must now have a name, similar to parameters ":".
// Use "/*splat" instead of "/*" to match the updated behavior.
// Reference: https://expressjs.com/en/guide/migrating-5.html#path-syntax
app.all('*splat', rrRequestHandler(viteDevServer));

log.info('  ✓ registering global error handler');
app.use(globalErrorHandler());

log.info('Server initialization completed with runtime configuration: %o', {
  client: Object.fromEntries(Object.entries(clientEnvironment).sort()),
  server: Object.fromEntries(Object.entries(serverEnvironment).sort()),
});

const server = app.listen(serverEnvironment.PORT);
log.info('Listening on http://localhost:%s/', (server.address() as AddressInfo).port);
