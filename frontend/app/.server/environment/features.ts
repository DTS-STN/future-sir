import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

export type Features = Readonly<z.infer<typeof features>>;

export const defaults = {
  ENABLE_DEVMODE_OIDC:
    process.env.NODE_ENV === 'production' //
      ? 'false'
      : 'true',
} as const;

export const features = z.object({
  ENABLE_DEVMODE_OIDC: ValidationUtils.asBoolean(z.string().default(defaults.ENABLE_DEVMODE_OIDC)),
});
