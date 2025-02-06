import * as v from 'valibot';

import { buildinfo, defaults as buildinfoDefaults } from '~/.server/environment/buildinfo';
import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';

export type Client = Readonly<v.InferOutput<typeof client>>;

export const defaults = {
  I18NEXT_DEBUG: 'false',
  ...buildinfoDefaults,
} as const;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
export const client = v.object({
  ...buildinfo.entries,
  I18NEXT_DEBUG: v.optional(stringToBooleanSchema(), defaults.I18NEXT_DEBUG),
  isProduction: v.boolean(),
});
