import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';

import { createReadableStreamFromReadable } from '@react-router/node';
import type { ActionFunctionArgs, AppLoadContext, EntryContext, LoaderFunctionArgs } from 'react-router';
import { ServerRouter } from 'react-router';

import { trace } from '@opentelemetry/api';
// see: https://valibot.dev/guides/internationalization/
import '@valibot/i18n/fr';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { I18nextProvider } from 'react-i18next';

import { LogFactory } from '~/.server/logging';
import { createCounter, handleSpanException } from '~/.server/utils/telemetry-utils';
import { isAppError } from '~/errors/app-error';
import { initI18next } from '~/i18n-config.server';
import { getLanguage } from '~/utils/i18n-utils';

/* eslint-disable no-param-reassign */

const log = LogFactory.getLogger(import.meta.url);

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const language = getLanguage(request);
  const i18n = await initI18next(language);

  return new Promise((resolve, reject) => {
    const userAgent = request.headers.get('user-agent');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode //
        ? 'onAllReady'
        : 'onShellReady';

    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <ServerRouter context={routerContext} url={request.url} nonce={loadContext.nonce} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          responseHeaders.set('Content-Type', 'text/html');

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            log.error('Error while rendering react element', error);
          }
        },
        nonce: loadContext.nonce,
      },
    );

    // Abort the streaming render pass after 11 seconds
    // to allow the rejected boundaries to be flushed
    // see: https://reactrouter.com/explanation/special-files#streamtimeout
    setTimeout(abort, 10_000);
  });
}

// https://reactrouter.com/explanation/special-files#handleerror
export function handleError(error: unknown, { context, params, request }: LoaderFunctionArgs | ActionFunctionArgs) {
  if (!request.signal.aborted) {
    log.error('Uncaught error while handling request:', error);

    createCounter('server.errors.total').add(1, {
      error_class: getErrorClassName(error),
      error_code: getErrorCode(error),
    });

    handleSpanException(error, trace.getActiveSpan());
  }
}

/**
 * Retrieves the class name of an error object.
 *
 * @param error - The error object whose class name is to be retrieved. It can be of any type.
 * @returns The class name of the error object if it is an object and has a constructor property, otherwise undefined.
 */
function getErrorClassName(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'constructor' in error) {
    return error.constructor.name;
  }
}

/**
 * Retrieves the error code of an error object.
 *
 * @param error - The error object whose error code is to be retrieved. It can be of any type.
 * @returns The error code of the error object if it is an AppError, otherwise undefined.
 */
function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.errorCode;
  }
}
