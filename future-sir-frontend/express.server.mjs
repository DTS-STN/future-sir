import { createRequestHandler } from '@react-router/express';

import compression from 'compression';
import RedisStore from 'connect-redis';
import express from 'express';
import session, { MemoryStore } from 'express-session';
import Redis from 'ioredis';
import { isbot } from 'isbot';
import { minimatch } from 'minimatch';
import { isEmpty, omit } from 'moderndash';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import util from 'node:util';
import sourceMapSupport from 'source-map-support';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';
import { z } from 'zod';

sourceMapSupport.install();

/**
 * @param {typeof logLevels} logLevels
 * @param {string} logLevel
 */
function getLogger(logLevels, logLevel) {
  /**
   * @param {string} category
   */
  return (category) =>
    winston.loggers.has(category)
      ? winston.loggers.get(category)
      : winston.loggers.add(category, {
          level: logLevel,
          levels: logLevels,
          format: format.combine(
            format.label({ label: category }),
            format.timestamp(),
            format.splat(),
            fullFormat(),
            format.printf((info) => {
              /**
               * @param {string} label
               * @param {number} size
               */
              const formatLabel = (label, size) => {
                const str = label.padStart(size);
                return str.length <= size ? str : `…${str.slice(-size + 1)}`;
              };

              const { label, level, message, timestamp, ...rest } = info;
              let formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;

              if (!isEmpty(rest)) {
                const stripped = omit(rest, [LEVEL, MESSAGE, SPLAT]);
                formattedInfo += ` --- ${util.inspect(stripped, false, null, true)}`;
              }

              return formattedInfo;
            }),
          ),
          transports: [new transports.Console()],
        });
}

const logLevels = { error: 0, warn: 1, info: 2, audit: 3, debug: 4, trace: 5 };
const consoleLogger = getLogger(logLevels, process.env.LOG_LEVEL || 'info')('console');
const serverLogger = getLogger(logLevels, process.env.LOG_LEVEL || 'info')('express.server.mjs');

/**
 * @param {typeof env} env
 */
function createRedisStore(env) {
  const redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      const backoff = Math.min(100 * Math.pow(2, times - 1), 10_000);

      if (times <= env.REDIS_CONNECT_MAX_RETRIES) {
        serverLogger.error(
          'Could not connect to Redis (attempt %s/%s); retry in %s ms',
          times,
          env.REDIS_CONNECT_MAX_RETRIES,
          backoff,
        );
        return backoff;
      }

      throw new Error(`Failed to connect to Redis after ${env.REDIS_CONNECT_MAX_RETRIES} attempts`);
    },
  });

  redisClient.on('connect', () => serverLogger.info('Successfully connected to Redis'));
  redisClient.on('error', (error) => serverLogger.error('Redis client error: %s', error.message));

  return new RedisStore({ client: redisClient, prefix: 'SESSION:', ttl: env.SESSION_EXPIRES_SECONDS });
}

/**
 * @param {typeof env} env
 */
function createSessionMiddleware(env) {
  return session({
    store:
      env.SESSION_STORAGE_TYPE === 'redis' //
        ? createRedisStore(env)
        : new MemoryStore(),
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_COOKIE_SECRET,
    genid: () => randomUUID(),
    proxy: true,
    resave: true,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      domain: env.SESSION_COOKIE_DOMAIN,
      path: env.SESSION_COOKIE_PATH,
      secure: isProduction,
      httpOnly: true,
      maxAge: env.SESSION_EXPIRES_SECONDS * 1000,
      sameSite: 'lax',
    },
  });
}

async function createViteDevServer() {
  const vite = await import('vite');
  return await vite.createServer({
    server: { middlewareMode: true },
  });
}

function parseAndValidateEnvironment() {
  serverLogger.info('Validating runtime environment...');

  /**
   * @param {string} str
   */
  const toNumber = (str) => parseInt(str);

  /**
   * @param {T} schema
   * @template {import('zod').ZodTypeAny} T
   */
  const toUndefined = (schema) => z.preprocess((value) => (value === '' ? undefined : value), schema);

  const environment = z
    .object({
      NODE_ENV: toUndefined(z.enum(['production', 'development']).default('development')),
      LOG_LEVEL: toUndefined(z.string().default('info')).refine((val) => Object.keys(logLevels).includes(val)),
      SERVER_PORT: toUndefined(z.string().default('3000').transform(toNumber)),
      // redis config
      REDIS_HOST: toUndefined(z.string().default('localhost')),
      REDIS_PORT: toUndefined(z.string().default('6379')).transform(toNumber),
      REDIS_PASSWORD: toUndefined(z.string().default('password')),
      REDIS_CONNECT_MAX_RETRIES: toUndefined(z.string().default('10').transform(toNumber)),
      // session config
      SESSION_COOKIE_DOMAIN: toUndefined(z.string().default('localhost')),
      SESSION_COOKIE_NAME: toUndefined(z.string().default('__FSIR||session')),
      SESSION_COOKIE_PATH: toUndefined(z.string().default('/')),
      SESSION_COOKIE_SECRET: toUndefined(z.string().default('secret')),
      SESSION_EXPIRES_SECONDS: toUndefined(z.string().default('3600')).transform(toNumber),
      SESSION_STORAGE_TYPE: toUndefined(z.enum(['memory', 'redis']).default('memory')),
    })
    .parse(process.env);

  serverLogger.info('Successfully validated server runtime environment');

  // eslint-disable-next-line no-unused-vars
  const { REDIS_PASSWORD, SESSION_COOKIE_SECRET, ...sanitizedEnv } = environment;
  serverLogger.debug('Server runtime environment: %o', sanitizedEnv);

  return environment;
}

function remapConsoleLoggers() {
  serverLogger.info('Remapping console loggers to winston loggers...');

  serverLogger.info('  → console.debug() to consoleLogger.debug()');
  console.debug = (args) => consoleLogger.debug(args);
  serverLogger.info('  → console.error() to consoleLogger.error()');
  console.error = (args) => consoleLogger.error(args);
  serverLogger.info('  → console.info() to consoleLogger.info()');
  console.info = (args) => consoleLogger.info(args);
  serverLogger.info('  → console.log() to consoleLogger.info()');
  console.log = (args) => consoleLogger.info(args);
  serverLogger.info('  → console.warn() to consoleLogger.warn()');
  console.warn = (args) => consoleLogger.warn(args);
}

remapConsoleLoggers();

const env = parseAndValidateEnvironment();
const isProduction = env.NODE_ENV === 'production';
const viteDevServer = !isProduction && (await createViteDevServer());

serverLogger.info(`Initializing %s mode express server...`, env.NODE_ENV);
const app = express();

serverLogger.info('  disabling X-Powered-By response header');
app.disable('x-powered-by');

serverLogger.info('  enabling reverse proxy support');
app.set('trust proxy', true);

{
  serverLogger.info('  configuring express middlewares...');

  {
    serverLogger.info('    → compression');
    app.use(compression());
  }

  {
    serverLogger.info('    → morgan');
    const format = isProduction ? 'tiny' : 'dev';
    const loggingMidlewareIgnore = ['/api/readyz', '/__manifest'];
    app.use(
      morgan(format, {
        stream: {
          write: (msg) => serverLogger.log('audit', msg.trim()),
        },
        skip: (request) => loggingMidlewareIgnore.some((entry) => minimatch(request.path, entry)),
      }),
    );
  }

  {
    serverLogger.info('    → static assets (%s)', env.NODE_ENV);

    if (isProduction) {
      serverLogger.debug('        caching /assets for 1y');
      app.use('/assets', express.static('build/client/assets', { immutable: true, maxAge: '1y' }));
      serverLogger.debug('        caching /locales for 1d');
      app.use('/locales', express.static('build/client/locales', { maxAge: '1d' }));
      serverLogger.debug('        caching remaining static content for 1y');
      app.use(express.static('build/client', { maxAge: '1y' }));
    }

    if (!isProduction) {
      serverLogger.debug('        caching /locales for 1m');
      app.use('/locales', express.static('public/locales', { maxAge: '1m' }));
      serverLogger.debug('        caching remaining static content for 1h');
      app.use(express.static('build/client', { maxAge: '1h' }));
    }
  }

  {
    if (viteDevServer) {
      serverLogger.info('    → vite dev server');
      app.use(viteDevServer.middlewares);
    }
  }

  {
    serverLogger.info('    → security headers');
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
    app.use((request, response, next) => {
      response.setHeader('Permissions-Policy', permissionsPolicy);
      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.setHeader('Server', 'webserver');
      response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'deny');
      next();
    });
  }

  {
    serverLogger.info('    → session middleware (%s)', env.SESSION_STORAGE_TYPE);
    const sessionMiddleware = createSessionMiddleware(env);
    const sessionMiddlewareIgnore = ['**/api/**'];
    app.use((request, response, next) => {
      const ignore = sessionMiddlewareIgnore.some((entry) => minimatch(request.path, entry));
      const isBot = isbot(request.headers?.['user-agent']);
      return isBot || ignore ? next() : sessionMiddleware(request, response, next);
    });
  }
}

serverLogger.info('  add LoggerFactory to global scope');
globalThis.LogFactory = { getLogger: getLogger(logLevels, env.LOG_LEVEL) };

{
  serverLogger.info('  registering react router request handler');
  // this is defined as a separate const to trick typescript
  // into letting us import a build file of unknown type
  const buildFile = './build/server/index.js';
  app.all(
    '*',
    createRequestHandler({
      mode: env.NODE_ENV,
      getLoadContext: ({ session }) => ({ session }),
      build: viteDevServer //
        ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
        : () => import(buildFile),
    }),
  );
}

serverLogger.info('Server initialization complete');
app.listen(env.SERVER_PORT, () => serverLogger.info(`Listening on http://localhost:${env.SERVER_PORT}/`));
