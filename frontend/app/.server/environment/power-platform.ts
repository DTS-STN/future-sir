import * as v from 'valibot';

import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

export type PowerPlatform = Readonly<v.InferOutput<typeof powerPlatform>>;

export const defaults = {
  PP_ENGLISH_LANGUAGE_CODE: '1033',
  PP_FRENCH_LANGUAGE_CODE: '1036',
  PP_CANADA_COUNTRY_CODE: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
} as const;

export const powerPlatform = v.object({
  PP_ENGLISH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_ENGLISH_LANGUAGE_CODE),
  PP_FRENCH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_FRENCH_LANGUAGE_CODE),
  PP_CANADA_COUNTRY_CODE: v.optional(v.string(), defaults.PP_CANADA_COUNTRY_CODE),
});
