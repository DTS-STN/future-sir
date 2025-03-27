import * as v from 'valibot';

import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';

export type Features = Readonly<v.InferOutput<typeof features>>;

const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  ENABLE_DEVMODE_OIDC: isProduction ? 'false' : 'true',
  ENABLE_SIN_APPLICATION_SERVICE_MOCK: isProduction ? 'false' : 'true',
  ENABLE_SIN_CASE_SERVICE_MOCK: isProduction ? 'false' : 'true',
  ENABLE_SIN_SEARCH_SERVICE_MOCK: isProduction ? 'false' : 'true',
  ENABLE_ASSOCIATE_SIN_SERVICE_MOCK: isProduction ? 'false' : 'true',
} as const;

export const features = v.object({
  ENABLE_DEVMODE_OIDC: v.optional(stringToBooleanSchema(), defaults.ENABLE_DEVMODE_OIDC),
  ENABLE_SIN_APPLICATION_SERVICE_MOCK: v.optional(stringToBooleanSchema(), defaults.ENABLE_SIN_APPLICATION_SERVICE_MOCK),
  ENABLE_SIN_CASE_SERVICE_MOCK: v.optional(stringToBooleanSchema(), defaults.ENABLE_SIN_CASE_SERVICE_MOCK),
  ENABLE_SIN_SEARCH_SERVICE_MOCK: v.optional(stringToBooleanSchema(), defaults.ENABLE_SIN_SEARCH_SERVICE_MOCK),
  ENABLE_ASSOCIATE_SIN_SERVICE_MOCK: v.optional(stringToBooleanSchema(), defaults.ENABLE_ASSOCIATE_SIN_SERVICE_MOCK),
});
