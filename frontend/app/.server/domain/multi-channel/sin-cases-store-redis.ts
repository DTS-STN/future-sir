import { differenceInSeconds, nextSunday } from 'date-fns';

import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import type { SinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store';
import { serverEnvironment } from '~/.server/environment';
import { getRedisClient } from '~/.server/redis';

/**
 * Redis-based implementation of SinCasesStore with advanced key management and expiration.
 *
 * Key features:
 * - Namespaced key management with server environment and build version
 * - Automatic expiration of keys until next Sunday
 * - Efficient key scanning and retrieval
 * - Batch operations for setting and deleting keys
 */
export function getRedisSinCasesStore(): SinCasesStore {
  /** Separator used in Redis key construction */
  const KEY_SEPARATOR = ':' as const;

  /** Namespace for Redis keys, combining environment and build version */
  const NS = ['SIN-CASES', serverEnvironment.BUILD_VERSION].join(KEY_SEPARATOR);

  /** Scan pattern to match all keys in this namespace */
  const SCAN_PATTERN = `${NS}${KEY_SEPARATOR}*`;

  /** Redis client instance */
  const _store = getRedisClient();

  /**
   * Constructs a fully qualified Redis key by prefixing the namespace
   * @param key - The base key to be qualified
   * @returns Fully qualified Redis key
   */
  function buildRedisKey(key: string): string {
    return [NS, key].join(KEY_SEPARATOR);
  }

  /**
   * Extracts the original key from a fully qualified Redis key
   * @param redisKey - The fully qualified Redis key
   * @returns The original key without namespace
   */
  function extractKey(redisKey: string): string {
    return redisKey.substring(NS.length + KEY_SEPARATOR.length);
  }

  /**
   * Calculates the number of seconds until the next Sunday
   * @returns Number of seconds until next Sunday
   */
  function secondsUntilNextSunday(): number {
    const now = new Date();
    return differenceInSeconds(nextSunday(now), now);
  }

  /**
   * Finds a single Sin Case by its key
   * @param key - The case identifier
   * @returns The found Sin Case or undefined
   */
  async function find(key: string): Promise<SinCaseDto | undefined> {
    const sinCase = await _store.get(buildRedisKey(key));
    return sinCase ? JSON.parse(sinCase) : undefined;
  }

  /**
   * Sets multiple Sin Cases with a single operation
   * Automatically sets expiration to next Sunday
   * @param sinCases - Sin Cases to store
   */
  async function set(...sinCases: SinCaseDto[]): Promise<void> {
    // Prepare multi-set operation
    const map = new Map(sinCases.map((sinCase) => [buildRedisKey(sinCase.caseId), JSON.stringify(sinCase)]));
    await _store.mset(map);

    // Set expiration for all cases
    await setExpireUntilNextSunday(...sinCases.map((c) => c.caseId));
  }

  /**
   * Sets expiration for specified keys until next Sunday
   * Uses Redis pipeline for efficiency
   * @param keys - Case identifiers to set expiration for
   */
  async function setExpireUntilNextSunday(...keys: string[]): Promise<void> {
    const ttlSeconds = secondsUntilNextSunday();
    const pipeline = _store.pipeline();

    keys.forEach((key) => {
      const redisKey = buildRedisKey(key);
      pipeline.expire(redisKey, ttlSeconds);
    });

    await pipeline.exec();
  }

  /**
   * Deletes multiple Sin Cases
   * Uses Redis pipeline for efficient bulk deletion
   * @param keys - Case identifiers to delete
   */
  async function del(...keys: string[]): Promise<void> {
    const pipeline = _store.pipeline();

    keys.forEach((key) => {
      const redisKey = buildRedisKey(key);
      pipeline.del(redisKey);
    });

    await pipeline.exec();
  }

  /**
   * Lists all keys in the current namespace
   * Uses Redis SCAN for memory-efficient key retrieval
   * @returns Array of case identifiers
   */
  async function listAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, foundKeys] = await _store.scan(cursor, 'MATCH', SCAN_PATTERN, 'COUNT', 100);

      cursor = newCursor;
      keys.push(...foundKeys.map(extractKey));
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Retrieves all Sin Cases from the store
   * @returns Array of all Sin Cases
   */
  async function listAll(): Promise<SinCaseDto[]> {
    const keys = await listAllKeys();
    const redisKeys = keys.map(buildRedisKey);

    const sinCases: SinCaseDto[] = [];
    for (const sinCase of await _store.mget(...redisKeys)) {
      if (sinCase) {
        sinCases.push(JSON.parse(sinCase));
      }
    }

    return sinCases;
  }

  /**
   * Checks if a specific key exists in the store
   * @param key - Case identifier to check
   * @returns Boolean indicating key existence
   */
  async function has(key: string): Promise<boolean> {
    const redisKey = buildRedisKey(key);
    return (await _store.exists(redisKey)) > 0;
  }

  /**
   * Checks if any keys exist in the current namespace
   * @returns Boolean indicating presence of any keys
   */
  async function hasAny(): Promise<boolean> {
    const keys = await _store.scan('0', 'MATCH', SCAN_PATTERN, 'COUNT', 1);
    return keys[1].length > 0;
  }

  return {
    delete: del,
    find,
    has,
    hasAny,
    listAll,
    listAllKeys,
    set,
  };
}
