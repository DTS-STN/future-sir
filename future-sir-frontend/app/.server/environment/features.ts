import { z } from 'zod';

import { asBoolean } from '~/utils/validation-utils';

export type Features = Readonly<z.infer<typeof features>>;

export const defaults = {
  DEFAULT_ENABLE_DEVMODE_OIDC:
    process.env.NODE_ENV === 'production' //
      ? 'false'
      : 'true',
} as const;

export const features = z.object({
  ENABLE_DEVMODE_OIDC: asBoolean(z.string().default(defaults.DEFAULT_ENABLE_DEVMODE_OIDC)),
});
