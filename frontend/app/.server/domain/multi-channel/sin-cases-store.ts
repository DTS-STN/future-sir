import type Redis from 'ioredis';

import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { serverEnvironment } from '~/.server/environment';
import { getRedisClient } from '~/.server/redis';

// Define the interface for our store operations
interface SinCasesStore {
  getByKey(key: string): Promise<SinCaseDto | null>;
  set(sinCase: SinCaseDto): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  listAllKeys(): Promise<string[]>;
  listAll(): Promise<SinCaseDto[]>;
  has(key: string): Promise<boolean>;
  hasAny(): Promise<boolean>;
}

/**
 * Map implementation of SinCasesStore
 */
class MapSinCasesStore implements SinCasesStore {
  private store: Map<string, SinCaseDto>;

  constructor() {
    this.store = new Map<string, SinCaseDto>();
  }

  getByKey(key: string): Promise<SinCaseDto | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  set(sinCase: SinCaseDto): Promise<boolean> {
    const key = sinCase.caseId;
    this.store.set(key, sinCase);
    return Promise.resolve(true);
  }

  delete(key: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(key));
  }

  listAllKeys(): Promise<string[]> {
    const keys: string[] = [];

    for (const key of this.store.keys()) {
      keys.push(key);
    }

    return Promise.resolve(keys);
  }

  async listAll(): Promise<SinCaseDto[]> {
    const keys = await this.listAllKeys();
    const allCases: SinCaseDto[] = [];

    for (const key of keys) {
      const sinCase = await this.getByKey(key);
      if (sinCase) {
        allCases.push(sinCase);
      }
    }

    return allCases;
  }

  has(key: string): Promise<boolean> {
    return Promise.resolve(this.store.has(key));
  }

  hasAny(): Promise<boolean> {
    return Promise.resolve(this.store.size > 0);
  }
}

/**
 * Redis implementation of SinCasesStore
 */
class RedisSinCasesStore implements SinCasesStore {
  private store: Redis;
  private namespace: string;

  constructor() {
    this.namespace = `sin-cases::${serverEnvironment.BUILD_VERSION}`;
    this.store = getRedisClient();
  }

  async getByKey(key: string): Promise<SinCaseDto | null> {
    const data = await this.store.get(this.namespace + '::' + key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(sinCase: SinCaseDto): Promise<boolean> {
    const key = sinCase.caseId;
    const data = JSON.stringify(sinCase);
    await this.store.set(this.namespace + '::' + key, data);
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const num = await this.store.del(this.namespace + '::' + key);
    return num > 0;
  }

  async listAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, foundKeys] = await this.store.scan(cursor, 'MATCH', `${this.namespace}::*`, 'COUNT', 100);
      cursor = newCursor;
      for (const key of foundKeys) {
        keys.push(key.substring(this.namespace.length + 2)); // +2 for '::'
      }
    } while (cursor !== '0');

    return keys;
  }

  async listAll(): Promise<SinCaseDto[]> {
    const keys = await this.listAllKeys();
    const allCases: SinCaseDto[] = [];

    for (const key of keys) {
      const sinCase = await this.getByKey(key);
      if (sinCase) {
        allCases.push(sinCase);
      }
    }

    return allCases;
  }

  async has(key: string): Promise<boolean> {
    return (await this.store.exists(this.namespace + '::' + key)) > 0;
  }

  async hasAny(): Promise<boolean> {
    const keys = await this.store.scan('0', 'MATCH', `${this.namespace}::*`, 'COUNT', 1);
    return keys[1].length > 0;
  }
}

// Singleton instance of the store
let sinCasesStore: SinCasesStore | undefined = undefined;

/**
 * Get the SinCasesStore instance, initializing if needed
 * @returns The SinCasesStore instance
 */
function getSinCasesStore(): SinCasesStore {
  if (sinCasesStore !== undefined) {
    return sinCasesStore;
  }

  if (serverEnvironment.SESSION_TYPE === 'redis') {
    sinCasesStore = new RedisSinCasesStore();
    return sinCasesStore;
  }

  // Map store as default
  sinCasesStore = new MapSinCasesStore();
  return sinCasesStore;
}

/**
 * List all sin cases
 * @returns A promise resolving to the array of sin cases
 */
export async function listAllSinCases(): Promise<SinCaseDto[]> {
  const store = getSinCasesStore();
  return await store.listAll();
}

/**
 * Get sin case by key
 * @param key - The key to retrieve sin case for
 * @returns A promise resolving to the sin case or null if not found
 */
export async function getSinCaseByKey(key: string): Promise<SinCaseDto | null> {
  const store = getSinCasesStore();
  return await store.getByKey(key);
}

/**
 * Set sin case
 * @param sinCase - The sin case to store
 * @returns A promise resolving to true if successful
 */
export async function setSinCase(sinCase: SinCaseDto): Promise<boolean> {
  const store = getSinCasesStore();
  return await store.set(sinCase);
}

/**
 * Check if a specific SIN case exists in the store.
 * @param key - The key of the SIN case to check.
 * @returns A promise resolving to `true` if the case exists, otherwise `false`.
 */
export async function hasSinCase(key: string): Promise<boolean> {
  const store = getSinCasesStore();
  return await store.has(key);
}

/**
 * Check if there are any SIN cases in the store.
 * @returns A promise resolving to `true` if at least one case exists, otherwise `false`.
 */
export async function hasAnySinCases(): Promise<boolean> {
  const store = getSinCasesStore();
  return await store.hasAny();
}

/**
 * Store multiple SIN cases in the store.
 * @param sinCases - An array of SIN cases to store.
 * @returns A promise resolving to `true` if all cases were stored successfully.
 */
export async function setSinCases(sinCases: SinCaseDto[]): Promise<boolean> {
  const store = getSinCasesStore();

  const results = await Promise.all(sinCases.map((sinCase) => store.set(sinCase)));

  // Return true only if all cases were successfully stored
  return results.every((result) => result === true);
}
