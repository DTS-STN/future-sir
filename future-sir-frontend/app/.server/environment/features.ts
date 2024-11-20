import { z } from 'zod';

import { asBoolean } from '~/utils/validation-utils';

export type Features = Readonly<z.infer<typeof features>>;

export const features = z.object({
  ENABLE_DEVMODE_OIDC: asBoolean(
    z.string().default(
      process.env.NODE_ENV === 'production' //
        ? 'false'
        : 'true',
    ),
  ),
});
