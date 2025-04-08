import { serverEnvironment } from '~/.server/environment';
import { createTypedApiClient } from '~/.server/shared/api/api-client-factory';
import type { paths as InteropPaths } from '~/.server/shared/api/fsir-openapi-schema';
import type { paths as PowerPlatformPaths } from '~/.server/shared/api/fsir-pp-open-api-schema';

export const interopClient = createTypedApiClient<InteropPaths>({
  baseUrl: serverEnvironment.INTEROP_SIN_REG_API_BASE_URL,
  authHeader: serverEnvironment.INTEROP_SIN_REG_API_AUTH_HEADER.value(),
  proxyUrl: serverEnvironment.INTEROP_PROXY_URL,
});

export const powerPlatformClient = createTypedApiClient<PowerPlatformPaths>({
  baseUrl: serverEnvironment.INTEROP_SIN_SEARCH_API_BASE_URL,
  authHeader: serverEnvironment.INTEROP_SIN_SEARCH_API_AUTH_HEADER.value(),
  proxyUrl: serverEnvironment.INTEROP_PROXY_URL,
});
