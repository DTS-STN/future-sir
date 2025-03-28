import type { ClientOptions, Config } from '@hey-api/client-fetch';
import { ProxyAgent } from 'undici';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Creates an API client configuration object by merging provided config with
 * default server-side settings.
 *
 * This function ensures that essential configurations like baseUrl and
 * authorization headers are included, using server environment variables.
 */
export function createClientConfig<T extends ClientOptions>(
  config?: Config<ClientOptions & T>,
): Config<Required<ClientOptions> & T> {
  const authHeader = serverEnvironment.INTEROP_SIN_REG_API_AUTH_HEADER.value();

  return {
    ...config,
    baseUrl: serverEnvironment.INTEROP_SIN_REG_API_BASE_URL,
    fetch: getFetchFn(),
    headers: { ...parseAuthorizationHeader(authHeader) },
  };
}

/**
 * Returns a fetch() function configured with a proxy if the INTEROP_PROXY_URL
 * environment variable is set. Otherwise, it returns undefined, indicating
 * that the default fetch function should be used.
 */
function getFetchFn(): Config['fetch'] {
  if (serverEnvironment.INTEROP_PROXY_URL) {
    const dispatcher = new ProxyAgent({ uri: serverEnvironment.INTEROP_PROXY_URL, proxyTls: { timeout: 10_000 } });
    // @ts-expect-error node's globalThis.fetch() and undici.fetch() are functionally equivalent
    return (request) => globalThis.fetch(request, { dispatcher });
  }
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
