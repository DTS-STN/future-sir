import createClient from 'openapi-fetch';

import type { paths } from '~/.server/shared/api/fsir-openapi-schema';
import { createClientOptions } from '~/.server/shared/api/interop-client-options';

export const interopClient = createClient<paths>(createClientOptions());
