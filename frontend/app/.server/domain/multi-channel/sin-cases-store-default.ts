import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import type { SinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store';

/**
 * Default in-memory implementation of SinCasesStore using JavaScript Map
 *
 * Key Features:
 * - Lightweight, non-persistent storage
 * - Async-compatible API matching SinCasesStore interface
 * - Suitable for testing, development, or temporary storage
 * - O(1) time complexity for most operations
 *
 * Limitations:
 * - Data is lost when application restarts
 * - Not suitable for distributed or persistent storage
 */
export function getDefaultSinCasesStore(): SinCasesStore {
  /** Internal storage using JavaScript Map */
  const _store = new Map<string, SinCaseDto>();

  /**
   * Retrieves a Sin Case by its key
   * @param key - The unique case identifier
   * @returns Promise resolving to the Sin Case or null
   */
  function find(key: string): Promise<SinCaseDto | null> {
    return Promise.resolve(_store.get(key) ?? null);
  }

  /**
   * Stores one or multiple Sin Cases
   * @param sinCases - Sin Cases to be stored
   * @returns Promise resolving when storage is complete
   */
  function set(...sinCases: SinCaseDto[]): Promise<void> {
    sinCases.forEach((sinCase) => {
      const key = sinCase.caseId;
      _store.set(key, sinCase);
    });
    return Promise.resolve();
  }

  /**
   * Deletes Sin Cases by their keys
   * @param keys - Case identifiers to delete
   * @returns Promise resolving when deletion is complete
   */
  function del(...keys: string[]): Promise<void> {
    keys.forEach((key) => {
      _store.delete(key);
    });
    return Promise.resolve();
  }

  /**
   * Retrieves all stored case keys
   * @returns Promise resolving to an array of case keys
   */
  function listAllKeys(): Promise<string[]> {
    return Promise.resolve(Array.from(_store.keys()));
  }

  /**
   * Retrieves all stored Sin Cases
   * @returns Promise resolving to an array of Sin Cases
   */
  function listAll(): Promise<SinCaseDto[]> {
    return Promise.resolve(Array.from(_store.values()));
  }

  /**
   * Checks if a specific case key exists
   * @param key - Case identifier to check
   * @returns Promise resolving to a boolean indicating existence
   */
  function has(key: string): Promise<boolean> {
    return Promise.resolve(_store.has(key));
  }

  /**
   * Checks if any cases are stored
   * @returns Promise resolving to a boolean indicating non-empty store
   */
  function hasAny(): Promise<boolean> {
    return Promise.resolve(_store.size > 0);
  }

  return {
    find,
    set,
    delete: del,
    listAllKeys,
    listAll,
    has,
    hasAny,
  };
}
