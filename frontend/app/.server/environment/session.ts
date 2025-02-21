import * as v from 'valibot';

import { Redacted } from '~/.server/utils/security-utils';
import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

export type Session = Readonly<v.InferOutput<typeof session>>;

export const defaults = {
  SESSION_TYPE: 'memory',
  SESSION_COOKIE_NAME: '__FSIR||session',
  SESSION_COOKIE_PATH: '/',
  SESSION_COOKIE_SAMESITE: 'strict',
  SESSION_COOKIE_SECRET: '00000000-0000-0000-0000-000000000000',
  SESSION_COOKIE_SECURE: 'true',
  SESSION_EXPIRES_SECONDS: '3600',
  SESSION_KEY_PREFIX: 'SESSION:',
} as const;

export const session = v.object({
  SESSION_TYPE: v.optional(v.picklist(['memory', 'redis']), defaults.SESSION_TYPE),
  SESSION_COOKIE_DOMAIN: v.optional(v.string()),
  SESSION_COOKIE_NAME: v.optional(v.string(), defaults.SESSION_COOKIE_NAME),
  SESSION_COOKIE_PATH: v.optional(v.string(), defaults.SESSION_COOKIE_PATH),
  SESSION_COOKIE_SAMESITE: v.optional(v.picklist(['lax', 'strict', 'none']), defaults.SESSION_COOKIE_SAMESITE),
  SESSION_COOKIE_SECRET: v.optional(
    v.pipe(v.string(), v.minLength(32), v.transform(Redacted.make)),
    defaults.SESSION_COOKIE_SECRET,
  ),
  SESSION_COOKIE_SECURE: v.optional(stringToBooleanSchema(), defaults.SESSION_COOKIE_SECURE),
  SESSION_EXPIRES_SECONDS: v.optional(v.pipe(stringToIntegerSchema(), v.minValue(0)), defaults.SESSION_EXPIRES_SECONDS),
  SESSION_KEY_PREFIX: v.optional(v.string(), defaults.SESSION_KEY_PREFIX),
});
