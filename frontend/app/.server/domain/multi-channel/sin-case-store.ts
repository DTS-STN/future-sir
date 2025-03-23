import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';

import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { serverEnvironment } from '~/.server/environment';
import { getRedisConfig } from '~/.server/redis';

type SinCasesStore = Keyv<SinCaseDto[]>;

// lazy-load sin cases store
let sinCasesStore: SinCasesStore | undefined = undefined;

export function getSinCasesStore(): SinCasesStore {
  if (sinCasesStore !== undefined) {
    return sinCasesStore;
  }

  const namespace = `sin-cases::${serverEnvironment.BUILD_VERSION}`;

  if (serverEnvironment.SESSION_TYPE === 'memory') {
    sinCasesStore = new Keyv({ namespace });
    return sinCasesStore;
  }

  // redis
  const config = getRedisConfig();
  const store = new KeyvRedis({
    url: `redis://${config.host}:${config.port}`,
    username: config.username,
    password: config.password,
  });

  sinCasesStore = new Keyv({ namespace, store });
  return sinCasesStore;
}
