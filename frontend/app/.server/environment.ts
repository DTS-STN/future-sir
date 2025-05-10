import { createHash } from 'node:crypto';
import * as v from 'valibot';

import type { Client } from '~/.server/environment/client';
import { client } from '~/.server/environment/client';
import type { Server } from '~/.server/environment/server';
import { server } from '~/.server/environment/server';
import { preprocess } from '~/utils/validation-utils';

export { defaults as clientDefaults } from '~/.server/environment/client';
export { defaults as serverDefaults } from '~/.server/environment/server';

export type ClientEnvironment = Client;
export type ServerEnvironment = Server;

const processed = preprocess(process.env);
const isProduction = processed.NODE_ENV === 'production';

const parsedClientEnvironment = v.parse(client, { ...processed, isProduction });
const parsedServerEnvironment = v.parse(server, { ...processed, isProduction });

export const clientEnvironment: ClientEnvironment & { revision: string } = {
  ...parsedClientEnvironment,
  revision: createHash('md5') //
    .update(String(parsedClientEnvironment))
    .digest('hex'),
};

export const serverEnvironment: ServerEnvironment & { revision: string } = {
  ...parsedServerEnvironment,
  revision: createHash('md5') //
    .update(String(parsedServerEnvironment))
    .digest('hex'),
};
