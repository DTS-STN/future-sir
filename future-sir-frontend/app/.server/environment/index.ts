import type { Client } from '~/.server/environment/client';
import { client } from '~/.server/environment/client';
import type { Server } from '~/.server/environment/server';
import { server } from '~/.server/environment/server';
import * as ValidationUtils from '~/utils/validation-utils';

export { defaults as clientDefaults } from '~/.server/environment/client';
export { defaults as serverDefaults } from '~/.server/environment/server';

export type ClientEnvironment = Client;
export type ServerEnvironment = Server;

const processed = ValidationUtils.preprocess(process.env);
const isProduction = processed.NODE_ENV === 'production';

export const clientEnvironment = client.parse({ ...processed, isProduction });
export const serverEnvironment = server.parse({ ...processed, isProduction });
