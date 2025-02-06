import * as v from 'valibot';

export type Features = Readonly<v.InferOutput<typeof features>>;

const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  ENABLE_DEVMODE_OIDC: isProduction ? 'false' : 'true',
} as const;

export const features = v.object({
  ENABLE_DEVMODE_OIDC: v.optional(
    v.pipe(
      v.picklist(['true', 'false']),
      v.transform((input) => input === 'true'),
    ),
    defaults.ENABLE_DEVMODE_OIDC,
  ),
});
