import type { ClientOptions, Config } from '@hey-api/client-fetch';

export function createClientConfig<T extends ClientOptions>(
  config?: Config<ClientOptions & T>,
): Config<Required<ClientOptions> & T> {
  return {
    ...config,
    // TODO: Setup Interop Server Environments
    // baseUrl: serverEnvironment.INTEROP_API_BASE_URI;
    headers: {
      // 'Ocp-Apim-Subscription-Key': serverEnvironment.INTEROP_API_SUBSCRIPTION_KEY,
    },
  };
}
