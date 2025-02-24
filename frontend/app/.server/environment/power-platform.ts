import * as v from 'valibot';

import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

export type PowerPlatform = Readonly<v.InferOutput<typeof powerPlatform>>;

export const defaults = {
  PP_ENGLISH_LANGUAGE_CODE: '1033',
  PP_FRENCH_LANGUAGE_CODE: '1036',
} as const;

export const powerPlatform = v.object({
  PP_ENGLISH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_ENGLISH_LANGUAGE_CODE),
  PP_FRENCH_LANGUAGE_CODE: v.optional(v.pipe(stringToIntegerSchema()), defaults.PP_FRENCH_LANGUAGE_CODE),
});
