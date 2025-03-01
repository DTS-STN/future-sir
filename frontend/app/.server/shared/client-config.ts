import type { CreateClientConfig } from '~/.server/shared/api/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  // TODO: Setup Interop Server Environments
  // baseUrl: serverEnvironment.INTEROP_API_BASE_URI;
  headers: {
    // 'Ocp-Apim-Subscription-Key': serverEnvironment.INTEROP_API_SUBSCRIPTION_KEY,
  },
});
