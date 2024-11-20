import { z } from 'zod';

import { asBoolean, asNumber, redact } from '~/utils/validation-utils';

export type Session = Readonly<z.infer<typeof session>>;

export const session = z.object({
  SESSION_TYPE: z.enum(['memory', 'redis']).default('memory'),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default('__FSIR||session'),
  SESSION_COOKIE_PATH: z.string().default('/'),
  SESSION_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('strict'),
  SESSION_COOKIE_SECRET: redact(z.string().default('00000000-0000-0000-0000-000000000000').pipe(z.string().min(32))),
  SESSION_COOKIE_SECURE: asBoolean(z.string().default('true')),
  SESSION_EXPIRES_SECONDS: asNumber(z.string().default('3600')).pipe(z.number().min(0)),
});
