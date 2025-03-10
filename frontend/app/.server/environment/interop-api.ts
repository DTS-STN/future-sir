import * as v from 'valibot';

import { Redacted } from '~/.server/utils/security-utils';

export type InteropApi = Readonly<v.InferOutput<typeof interopApi>>;

export const defaults = {
  INTEROP_SIN_REG_API_AUTH_HEADER: 'Ocp-Apim-Subscription-Key 00000000000000000000000000000000',
  INTEROP_SIN_REG_API_BASE_URL: 'http://localhost:3000/api',
} as const;

export const interopApi = v.object({
  INTEROP_SIN_REG_API_AUTH_HEADER: v.pipe(
    v.optional(v.string(), defaults.INTEROP_SIN_REG_API_AUTH_HEADER),
    v.transform(Redacted.make),
  ),
  INTEROP_SIN_REG_API_BASE_URL: v.optional(v.string(), defaults.INTEROP_SIN_REG_API_BASE_URL),
});
