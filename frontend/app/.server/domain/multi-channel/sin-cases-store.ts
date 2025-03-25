import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { getDefaultSinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store-default';
import { getRedisSinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store-redis';
import { serverEnvironment } from '~/.server/environment';
import { singleton } from '~/.server/utils/instance-registry';

/**
 * Defines the contract for SIN cases storage operations
 * Supports various storage backends with a consistent interface
 */
export type SinCasesStore = {
  /**
   * Removes specified keys from the store
   * @param keys - Keys to delete
   */
  delete(...keys: string[]): Promise<void>;

  /**
   * Retrieves a single SIN case by its key
   * @param key - Unique identifier for the SIN case
   * @returns Promise resolving to the SIN case or null if not found
   */
  find(key: string): Promise<SinCaseDto | null>;

  /**
   * Checks if a specific SIN case exists
   * @param key - Key to check for existence
   * @returns Promise resolving to boolean indicating existence
   */
  has(key: string): Promise<boolean>;

  /**
   * Checks if any SIN cases are stored
   * @returns Promise resolving to boolean indicating non-empty store
   */
  hasAny(): Promise<boolean>;

  /**
   * Retrieves all stored SIN cases
   * @returns Promise resolving to array of all SIN cases
   */
  listAll(): Promise<SinCaseDto[]>;

  /**
   * Retrieves all stored SIN case keys
   * @returns Promise resolving to array of keys
   */
  listAllKeys(): Promise<string[]>;

  /**
   * Stores one or multiple SIN cases
   * @param sinCases - SIN cases to store
   */
  set(...sinCases: SinCaseDto[]): Promise<void>;
};

/**
 * Initializes and retrieves the appropriate SIN cases store
 * Supports different storage backends based on environment configuration
 *
 * @returns Configured SinCasesStore instance
 */
function getSinCasesStore(): SinCasesStore {
  return singleton('sinCasesStore', () =>
    serverEnvironment.SESSION_TYPE === 'redis'
      ? getRedisSinCasesStore() //
      : getDefaultSinCasesStore(),
  );
}

/**
 * Retrieves all SIN cases from the store
 * @returns Promise resolving to array of SIN cases
 */
export async function listAllSinCases(): Promise<SinCaseDto[]> {
  const store = getSinCasesStore();
  return await store.listAll();
}

/**
 * Retrieves a specific SIN case by its key
 * @param key - Unique identifier for the SIN case
 * @returns Promise resolving to the SIN case or null if not found
 */
export async function findSinCase(key: string): Promise<SinCaseDto | null> {
  const store = getSinCasesStore();
  return await store.find(key);
}

/**
 * Verifies existence of a specific SIN case
 * @param key - Key to check for existence
 * @returns Promise resolving to boolean indicating case existence
 */
export async function hasSinCase(key: string): Promise<boolean> {
  const store = getSinCasesStore();
  return await store.has(key);
}

/**
 * Checks if any SIN cases are present in the store
 * @returns Promise resolving to boolean indicating store non-emptiness
 */
export async function hasAnySinCases(): Promise<boolean> {
  const store = getSinCasesStore();
  return await store.hasAny();
}

/**
 * Stores multiple SIN cases in the configured store
 * @param sinCases - SIN cases to be stored
 */
export async function setSinCases(...sinCases: SinCaseDto[]): Promise<void> {
  const store = getSinCasesStore();
  await store.set(...sinCases);
}
