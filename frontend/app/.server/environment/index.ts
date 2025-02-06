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

export const clientEnvironment = v.parse(client, { ...processed, isProduction });
export const serverEnvironment = v.parse(server, { ...processed, isProduction });

export const clientEnvironmentRevision = createHash('md5').update(JSON.stringify(clientEnvironment)).digest('hex');
export const serverEnvironmentRevision = createHash('md5').update(JSON.stringify(serverEnvironment)).digest('hex');
