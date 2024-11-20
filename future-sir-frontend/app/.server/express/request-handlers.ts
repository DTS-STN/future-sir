import { createRequestHandler } from '@react-router/express';

import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import path from 'node:path';
import type { ViteDevServer } from 'vite';

import type { ClientEnvironment, ServerEnvironment } from '~/.server/express/environment';
import { getLogger } from '~/.server/express/logging';

const log = getLogger('request-handlers');

export function globalErrorHandler(serverEnvironment: ServerEnvironment): ErrorRequestHandler {
  return (error: unknown, request: Request, response: Response, next: NextFunction) => {
    log.error(error);

    if (response.headersSent) {
      return next(error);
    }

    const errorFile =
      response.statusCode === 403 //
        ? './assets/403.html'
        : './assets/500.html';

    const errorFilePath = path.join(import.meta.dirname, errorFile);

    response.status(response.statusCode).sendFile(errorFilePath, (dispatchError: unknown) => {
      if (dispatchError) {
        log.error(dispatchError);
        response.status(500).send('Internal Server Error');
      }
    });
  };
}

export function remixRequestHandler(
  clientEnvironment: ClientEnvironment,
  serverEnvironment: ServerEnvironment,
  viteDevServer?: ViteDevServer,
) {
  // dynamically declare the path to avoid static analysis errors 💩
  const rrServerBuild = './app.js';

  return createRequestHandler({
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
  });
}
