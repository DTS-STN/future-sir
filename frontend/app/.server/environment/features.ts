import * as v from 'valibot';

import { stringToBooleanSchema } from '../validation/string-to-boolean-schema';

import { boolToString } from '~/utils/boolean-utils';

export type Features = Readonly<v.InferOutput<typeof features>>;

const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  ENABLE_DEVMODE_OIDC: isProduction ? boolToString(false) : boolToString(true),
} as const;

export const features = v.object({
  ENABLE_DEVMODE_OIDC: v.optional(stringToBooleanSchema(), defaults.ENABLE_DEVMODE_OIDC),
});
