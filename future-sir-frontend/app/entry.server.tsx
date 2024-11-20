import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';

import { createReadableStreamFromReadable } from '@react-router/node';
import type { ActionFunctionArgs, AppLoadContext, EntryContext, LoaderFunctionArgs } from 'react-router';
import { ServerRouter } from 'react-router';

import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { I18nextProvider } from 'react-i18next';

import { initI18next } from '~/i18n-config.server';
import { getLanguage } from '~/utils';

/* eslint-disable no-param-reassign */

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const log = loadContext.getLogger('entry.server.tsx');

  log.trace('Adding LoggerFactory to global scope');
  globalThis.LogFactory = { getLogger: loadContext.getLogger };

  const language = getLanguage(request);
  const i18n = await initI18next(language);

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get('user-agent');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    // prettier-ignore
    const readyOption: keyof RenderToPipeableStreamOptions = (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <ServerRouter context={routerContext} url={request.url} abortDelay={ABORT_DELAY} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          responseHeaders.set('Content-Type', 'text/html');

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }));
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            log.error('%o', error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

export function handleError(error: unknown, { request, params, context }: LoaderFunctionArgs | ActionFunctionArgs) {
  const log = LogFactory.getLogger('entry.server.tsx');

  if (!request.signal.aborted) {
    log.error('An unexpected error occurred', error);
  }
}
