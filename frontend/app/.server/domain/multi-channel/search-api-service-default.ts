import { ProxyAgent } from 'undici';

import type { SearchResponse } from '~/.server/domain/multi-channel/search-api-models';
import type { SinSearchService } from '~/.server/domain/multi-channel/search-api-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';

const log = LogFactory.getLogger(import.meta.url);

export function getDefaultSearchService(): SinSearchService {
  return {
    getSearchResults: async (caseId: string): Promise<SearchResponse> => {
      const fetchFn = getFetchFn();

      const authHeader = serverEnvironment.INTEROP_SIN_SEARCH_API_AUTH_HEADER.value();
      const response = await fetchFn(`${serverEnvironment.INTEROP_SIN_SEARCH_API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...parseAuthorizationHeader(authHeader),
        },
        body: JSON.stringify({
          caseGuid: caseId,
          idToken: serverEnvironment.TMP_AWS_ID_TOKEN.value(),
        }),
      });
      if (response.status === HttpStatusCodes.NOT_FOUND) return {};
      if (!response.ok) {
        throw new AppError(`Search results for case ID '${caseId}' not found.`, ErrorCodes.SEARCH_RESULTS_NOT_FOUND);
      }
      return response.json();
    },
  };
}

/**
 * Returns a fetch() function configured with a proxy if the INTEROP_PROXY_URL
 * environment variable is set. Otherwise, it returns undefined, indicating
 * that the default fetch function should be used.
 *
 * TODO ::: GjB ::: this function should be removed and this entire module should use `interop-client-config`
 */
function getFetchFn(): typeof globalThis.fetch {
  if (!serverEnvironment.INTEROP_PROXY_URL) return globalThis.fetch;

  const dispatcher = new ProxyAgent({ uri: serverEnvironment.INTEROP_PROXY_URL, proxyTls: { timeout: 60_000 } });

  // @ts-expect-error node's globalThis.fetch() and undici.fetch() are functionally equivalent
  return (input, init) => globalThis.fetch(input, { ...init, dispatcher });
}

/**
 * Parses the authorization header string into a key/value pair for http headers.
 *
 * It expects the input string to be in the format "key value", where "key" is
 * the header name and "value" is the header value. If the input string does not
 * conform to this format, a warning is logged, and an empty header object is
 * returned.
 */
function parseAuthorizationHeader(input: string): Record<string, string> {
  const parts = input.split(' ');

  if (parts.length < 2) {
    log.warn('Authorization header is not in the expected "key value" format; ignoring');
    return {};
  }

  const [key, ...valueParts] = parts;
  const value = valueParts.join(' ');

  return { [key]: value };
}
