import * as v from 'valibot';

export type Buildinfo = Readonly<v.InferOutput<typeof buildinfo>>;

export const defaults = {
  BUILD_DATE: '1970-01-01T00:00:00.000Z',
  BUILD_ID: '000000',
  BUILD_REVISION: '00000000',
  BUILD_VERSION: '0.0.0-000000-00000000',
} as const;

export const buildinfo = v.object({
  BUILD_DATE: v.optional(v.string(), defaults.BUILD_DATE),
  BUILD_ID: v.optional(v.string(), defaults.BUILD_ID),
  BUILD_REVISION: v.optional(v.string(), defaults.BUILD_REVISION),
  BUILD_VERSION: v.optional(v.string(), defaults.BUILD_VERSION),
});
