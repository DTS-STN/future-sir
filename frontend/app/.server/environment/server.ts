import * as v from 'valibot';

import { authentication, defaults as authenticationDefaults } from '~/.server/environment/authentication';
import { client, defaults as clientDefaults } from '~/.server/environment/client';
import { features, defaults as featuresDefaults } from '~/.server/environment/features';
import { interopApi, defaults as interopApiDefaults } from '~/.server/environment/interop-api';
import { logging, defaults as loggingDefaults } from '~/.server/environment/logging';
import { redis, defaults as redisDefaults } from '~/.server/environment/redis';
import { session, defaults as sessionDefaults } from '~/.server/environment/session';
import { telemetry, defaults as telemetryDefaults } from '~/.server/environment/telemetry';
import { LogFactory } from '~/.server/logging';
import { Redacted } from '~/.server/utils/security-utils';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

const log = LogFactory.getLogger(import.meta.url);

export type Server = Readonly<v.InferOutput<typeof server>>;

export const defaults = {
  NODE_ENV: 'development',
  PORT: '3000',
  // Note that while this might look dangerous, this is only ever used in
  // devmode, so there is no security risk in exposing this to the public!
  //
  // The default token contains the following claims:
  // {
  //  "aud": "localhost",
  //  "iss": "future-sir",
  //  "sub": "00000000-0000-0000-0000-000000000000",
  //  "given_name": "Application",
  //  "family_name": "User",
  //  "email": "user@example.com"
  // }
  // prettier-ignore
  TMP_AWS_ID_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJmdXR1cmUtc2lyIiwiaWF0Ijo5NDY2ODQ4MDAsImV4cCI6NDEwMjQ0NDgwMCwiYXVkIjoibG9jYWxob3N0Iiwic3ViIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiZ2l2ZW5fbmFtZSI6IkFwcGxpY2F0aW9uIiwiZmFtaWx5X25hbWUiOiJVc2VyIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.bHQFw4LHShBjQgNKJ3hBcHTf6aFN8M9j9ZEvw5rHEKk',
  ...authenticationDefaults,
  ...clientDefaults,
  ...featuresDefaults,
  ...interopApiDefaults,
  ...loggingDefaults,
  ...redisDefaults,
  ...sessionDefaults,
  ...telemetryDefaults,
} as const;

/**
 * Server-side environment variables.
 * Also includes all client-side variables.
 */
export const server = v.pipe(
  v.object({
    ...authentication.entries,
    ...client.entries,
    ...features.entries,
    ...logging.entries,
    ...interopApi.entries,
    ...redis.entries,
    ...session.entries,
    ...telemetry.entries,
    NODE_ENV: v.optional(v.picklist(['production', 'development', 'test']), defaults.NODE_ENV),
    PORT: v.optional(v.pipe(stringToIntegerSchema(), v.minValue(0)), defaults.PORT),

    // TTTTTTTTTTTTTTTTTTTTTTT     OOOOOOOOO     DDDDDDDDDDDDD             OOOOOOOOO
    // T:::::::::::::::::::::T   OO:::::::::OO   D::::::::::::DDD        OO:::::::::OO
    // T:::::::::::::::::::::T OO:::::::::::::OO D:::::::::::::::DD    OO:::::::::::::OO
    // T:::::TT:::::::TT:::::TO:::::::OOO:::::::ODDD:::::DDDDD:::::D  O:::::::OOO:::::::O
    // TTTTTT  T:::::T  TTTTTTO::::::O   O::::::O  D:::::D    D:::::D O::::::O   O::::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O:::::O     O:::::O  D:::::D     D:::::DO:::::O     O:::::O
    //         T:::::T        O::::::O   O::::::O  D:::::D    D:::::D O::::::O   O::::::O
    //       TT:::::::TT      O:::::::OOO:::::::ODDD:::::DDDDD:::::D  O:::::::OOO:::::::O
    //       T:::::::::T       OO:::::::::::::OO D:::::::::::::::DD    OO:::::::::::::OO
    //       T:::::::::T         OO:::::::::OO   D::::::::::::DDD        OO:::::::::OO
    //       TTTTTTTTTTT           OOOOOOOOO     DDDDDDDDDDDDD             OOOOOOOOO
    //
    // TODO ::: GjB ::: remove after demo
    TMP_AWS_ID_TOKEN: v.pipe(v.optional(v.string(), defaults.TMP_AWS_ID_TOKEN), v.transform(Redacted.make)),
  }),
  v.rawCheck(({ dataset }) => {
    if (dataset.typed) {
      const { value } = dataset;

      warn(
        value.isProduction && value.ENABLE_DEVMODE_OIDC === true,
        'Setting ENABLE_DEVMODE_OIDC=true is not recommended in production!',
      );
    }
  }),
);

/**
 * Logs a warning if the check evaluates to true.
 * Always returns true so it can be used in a zod refine() function.
 */
function warn(check: boolean, message: string): true {
  return check && log.warn(message), true;
}
