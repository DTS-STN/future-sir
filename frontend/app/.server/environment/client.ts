import * as v from 'valibot';

import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

export type Client = Readonly<v.InferOutput<typeof client>>;

export const defaults = {
  BUILD_DATE: '1970-01-01T00:00:00.000Z',
  BUILD_ID: '000000',
  BUILD_REVISION: '00000000',
  BUILD_VERSION: '0.0.0-000000-00000000',
  I18NEXT_DEBUG: 'false',
  PP_ENGLISH_LANGUAGE_CODE: '1033',
  PP_FRENCH_LANGUAGE_CODE: '1036',
  PP_CANADA_COUNTRY_CODE: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
  PP_HAS_HAD_PREVIOUS_SIN_CODE: '564190000',
} as const;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
export const client = v.object({
  BUILD_DATE: v.optional(v.string(), defaults.BUILD_DATE),
  BUILD_ID: v.optional(v.string(), defaults.BUILD_ID),
  BUILD_REVISION: v.optional(v.string(), defaults.BUILD_REVISION),
  BUILD_VERSION: v.optional(v.string(), defaults.BUILD_VERSION),
  I18NEXT_DEBUG: v.optional(stringToBooleanSchema(), defaults.I18NEXT_DEBUG),
  PP_ENGLISH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_ENGLISH_LANGUAGE_CODE),
  PP_FRENCH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_FRENCH_LANGUAGE_CODE),
  PP_CANADA_COUNTRY_CODE: v.optional(v.string(), defaults.PP_CANADA_COUNTRY_CODE),
  PP_HAS_HAD_PREVIOUS_SIN_CODE: v.optional(v.string(), defaults.PP_HAS_HAD_PREVIOUS_SIN_CODE),
  isProduction: v.boolean(),
});
