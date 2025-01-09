import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

export type Session = Readonly<z.infer<typeof session>>;

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

export const session = z.object({
  SESSION_TYPE: z.enum(['memory', 'redis']).default(defaults.SESSION_TYPE),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default(defaults.SESSION_COOKIE_NAME),
  SESSION_COOKIE_PATH: z.string().default(defaults.SESSION_COOKIE_PATH),
  SESSION_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default(defaults.SESSION_COOKIE_SAMESITE),
  SESSION_COOKIE_SECRET: ValidationUtils.redact(z.string().default(defaults.SESSION_COOKIE_SECRET).pipe(z.string().min(32))),
  SESSION_COOKIE_SECURE: ValidationUtils.asBoolean(z.string().default(defaults.SESSION_COOKIE_SECURE)),
  SESSION_EXPIRES_SECONDS: ValidationUtils.asNumber(
    z.string().default(defaults.SESSION_EXPIRES_SECONDS), //
  ).pipe(z.number().min(0)),
  SESSION_KEY_PREFIX: z.string().default(defaults.SESSION_KEY_PREFIX),
});
