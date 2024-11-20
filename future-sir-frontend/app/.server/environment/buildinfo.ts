import { z } from 'zod';

export type Buildinfo = Readonly<z.infer<typeof buildinfo>>;

export const buildinfo = z.object({
  BUILD_DATE: z.string().default('1970-01-01T00:00:00.000Z'),
  BUILD_ID: z.string().default('000000'),
  BUILD_REVISION: z.string().default('00000000'),
  BUILD_VERSION: z.string().default('0.0.0'),
});
