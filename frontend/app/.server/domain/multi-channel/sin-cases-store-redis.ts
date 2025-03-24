import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import type { SinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store';
import { serverEnvironment } from '~/.server/environment';
import { getRedisClient } from '~/.server/redis';

/**
 * Redis implementation of SinCasesStore
 */
export function getRedisSinCasesStore(): SinCasesStore {
  const KEY_SEPERATOR = ':' as const;
  const namespace = ['sin-cases', serverEnvironment.BUILD_VERSION].join(KEY_SEPERATOR);
  const store = getRedisClient();

  function buildKey(key: string) {
    return [namespace, key].join(KEY_SEPERATOR);
  }

  function nextSunday(): Date {
    const currentDate = new Date();
    const nextSunday = new Date(currentDate);
    nextSunday.setDate(currentDate.getDate() + (7 - currentDate.getDay()));
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
  }

  async function expireAt(key: string, date: Date): Promise<number> {
    const unixTimeSeconds = Math.round(date.getTime() / 1000);
    return await store.expireat(buildKey(key), unixTimeSeconds);
  }

  async function getByKey(key: string): Promise<SinCaseDto | null> {
    const data = await store.get(buildKey(key));
    if (!data) return null;
    return JSON.parse(data);
  }

  async function set(sinCase: SinCaseDto): Promise<boolean> {
    const key = sinCase.caseId;
    const data = JSON.stringify(sinCase);
    await store.set(buildKey(key), data);
    await expireAt(buildKey(key), nextSunday());
    return true;
  }

  async function _delete(key: string): Promise<boolean> {
    const num = await store.del(buildKey(key));
    return num > 0;
  }

  async function listAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, foundKeys] = await store.scan(cursor, 'MATCH', `${namespace}::*`, 'COUNT', 100);
      cursor = newCursor;
      for (const key of foundKeys) {
        keys.push(key.substring(namespace.length + KEY_SEPERATOR.length));
      }
    } while (cursor !== '0');

    return keys;
  }

  async function listAll(): Promise<SinCaseDto[]> {
    const keys = await listAllKeys();
    const allCases: SinCaseDto[] = [];

    for (const key of keys) {
      const sinCase = await getByKey(key);
      if (sinCase) {
        allCases.push(sinCase);
      }
    }

    return allCases;
  }

  async function has(key: string): Promise<boolean> {
    return (await store.exists(buildKey(key))) > 0;
  }

  async function hasAny(): Promise<boolean> {
    const keys = await store.scan('0', 'MATCH', `${namespace}${KEY_SEPERATOR}*`, 'COUNT', 1);
    return keys[1].length > 0;
  }

  return {
    getByKey,
    set,
    delete: _delete,
    listAllKeys,
    listAll,
    has,
    hasAny,
  };
}
