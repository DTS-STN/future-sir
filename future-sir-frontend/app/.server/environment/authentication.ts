import { z } from 'zod';

import { redact } from '~/utils/validation-utils';

export type Authentication = Readonly<z.infer<typeof authentication>>;

export const authentication = z.object({
  AUTH_DEFAULT_PROVIDER: z.enum(['azuread', 'local']).default(
    process.env.NODE_ENV === 'production' //
      ? 'azuread'
      : 'local',
  ),

  AZUREAD_ISSUER_URL: z.string().optional(),
  AZUREAD_CLIENT_ID: z.string().optional(),
  AZUREAD_CLIENT_SECRET: redact(z.string().optional()),
});
