import { UNSAFE_invariant } from 'react-router';

import type { ClientOptions } from 'openapi-fetch';
import createClient from 'openapi-fetch';
import { ProxyAgent } from 'undici';

import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

interface ApiConfig {
  baseUrl: string;
  authHeader?: string;
  proxyUrl?: string;
  additionalHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * Creates an API client configuration object by merging provided config with
 * default server-side settings.
 *
 * @param apiConfig - Configuration for the API client
 * @param clientOptions - Additional client options to merge
 */
export function createApiClientOptions(apiConfig: ApiConfig, clientOptions?: ClientOptions): ClientOptions {
  return {
    ...clientOptions,
    baseUrl: apiConfig.baseUrl,
    fetch: getFetchFn(apiConfig.proxyUrl, apiConfig.timeout),
    headers: {
      ...clientOptions?.headers,
      ...(apiConfig.authHeader ? parseAuthorizationHeader(apiConfig.authHeader) : {}),
      ...apiConfig.additionalHeaders,
    },
  };
}

/**
 * Returns a fetch() function configured with a proxy if the proxyUrl
 * is provided. Otherwise, it returns undefined to use the default fetch.
 */
function getFetchFn(proxyUrl?: string, timeout = 60_000): ClientOptions['fetch'] {
  if (proxyUrl) {
    const dispatcher = new ProxyAgent({
      uri: proxyUrl,
      proxyTls: { timeout },
    });
    // @ts-expect-error node's globalThis.fetch() and undici.fetch() are functionally equivalent
    return (request) => globalThis.fetch(request, { dispatcher });
  }
  return undefined;
}

/**
 * Parses the authorization header string into a key/value pair for http headers.
 */
function parseAuthorizationHeader(input: string): Record<string, string> {
  const parts = input.split(' ');
  if (parts.length < 2) {
    log.warn('Authorization header is not in the expected "key value" format; ignoring');
    return {};
  }
  const [key, ...valueParts] = parts;
  const value = valueParts.join(' ');
  UNSAFE_invariant(key, 'Expected key to be defined');
  return { [key]: value };
}

/**
 * Creates a typed API client with the given configuration
 *
 * @param schemaType - The OpenAPI schema type definition
 * @param apiConfig - API configuration object
 * @param clientOptions - Additional client options
 */
export function createTypedApiClient<schemaType extends object>(apiConfig: ApiConfig, clientOptions?: ClientOptions) {
  return createClient<schemaType>(createApiClientOptions(apiConfig, clientOptions));
}
