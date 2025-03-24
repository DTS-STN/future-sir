import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { getDefaultSinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store-default';
import { getRedisSinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store-redis';
import { serverEnvironment } from '~/.server/environment';

// Define the interface for our store operations
export type SinCasesStore = {
  getByKey(key: string): Promise<SinCaseDto | null>;
  set(sinCase: SinCaseDto): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  listAllKeys(): Promise<string[]>;
  listAll(): Promise<SinCaseDto[]>;
  has(key: string): Promise<boolean>;
  hasAny(): Promise<boolean>;
};

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
    sinCasesStore = getRedisSinCasesStore();
    return sinCasesStore;
  }

  // Map store as default
  sinCasesStore = getDefaultSinCasesStore();
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
