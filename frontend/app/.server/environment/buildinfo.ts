import { z } from 'zod';

export type Buildinfo = Readonly<z.infer<typeof buildinfo>>;

export const defaults = {
  DEFAULT_BUILD_DATE: '1970-01-01T00:00:00.000Z',
  DEFAULT_BUILD_ID: '000000',
  DEFAULT_BUILD_REVISION: '00000000',
  DEFAULT_BUILD_VERSION: '0.0.0-000000-00000000',
} as const;

export const buildinfo = z.object({
  BUILD_DATE: z.string().default(defaults.DEFAULT_BUILD_DATE),
  BUILD_ID: z.string().default(defaults.DEFAULT_BUILD_ID),
  BUILD_REVISION: z.string().default(defaults.DEFAULT_BUILD_REVISION),
  BUILD_VERSION: z.string().default(defaults.DEFAULT_BUILD_VERSION),
});
