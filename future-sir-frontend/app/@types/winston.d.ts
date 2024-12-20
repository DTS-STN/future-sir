import 'winston';

import type { Logger as AppLogger } from '~/.server/logging';

declare module 'winston' {
  interface Logger extends AppLogger {}
}

export {};
