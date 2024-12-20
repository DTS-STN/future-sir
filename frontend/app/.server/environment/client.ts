import { z } from 'zod';

import { buildinfo, defaults as buildinfoDefaults } from '~/.server/environment/buildinfo';
import * as ValidationUtils from '~/utils/validation-utils';

export type Client = Readonly<z.infer<typeof client>>;

export const defaults = {
  I18NEXT_DEBUG: 'false',
  ...buildinfoDefaults,
} as const;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
export const client = z
  .object({
    I18NEXT_DEBUG: ValidationUtils.asBoolean(z.string().default(defaults.I18NEXT_DEBUG)),
    isProduction: z.boolean(),
  })
  .merge(buildinfo);
