import * as v from 'valibot';

import { Redacted } from '~/.server/utils/security-utils';

export type Authentication = Readonly<v.InferOutput<typeof authentication>>;

const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  AUTH_DEFAULT_PROVIDER: isProduction ? 'azuread' : 'local',
} as const;

export const authentication = v.object({
  AUTH_DEFAULT_PROVIDER: v.optional(v.picklist(['awscognito', 'azuread', 'local']), defaults.AUTH_DEFAULT_PROVIDER),

  AWSCOGNITO_ISSUER_URL: v.optional(v.string()),
  AWSCOGNITO_CLIENT_ID: v.optional(v.string()),
  AWSCOGNITO_CLIENT_SECRET: v.optional(v.pipe(v.string(), v.transform(Redacted.make))),

  AZUREAD_ISSUER_URL: v.optional(v.string()),
  AZUREAD_CLIENT_ID: v.optional(v.string()),
  AZUREAD_CLIENT_SECRET: v.optional(v.pipe(v.string(), v.transform(Redacted.make))),
});
