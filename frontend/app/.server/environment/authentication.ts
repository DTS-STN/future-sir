import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

export type Authentication = Readonly<z.infer<typeof authentication>>;

export const defaults = {
  DEFAULT_AUTH_DEFAULT_PROVIDER:
    process.env.NODE_ENV === 'production' //
      ? 'azuread'
      : 'local',
} as const;

export const authentication = z.object({
  AUTH_DEFAULT_PROVIDER: z.enum(['azuread', 'local']).default(defaults.DEFAULT_AUTH_DEFAULT_PROVIDER),

  AZUREAD_ISSUER_URL: z.string().optional(),
  AZUREAD_CLIENT_ID: z.string().optional(),
  AZUREAD_CLIENT_SECRET: ValidationUtils.redact(z.string().optional()),
});
