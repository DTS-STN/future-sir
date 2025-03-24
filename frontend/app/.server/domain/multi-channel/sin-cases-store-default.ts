import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import type { SinCasesStore } from '~/.server/domain/multi-channel/sin-cases-store';

/**
 * Default implementation of SinCasesStore using Map as store
 */
export function getDefaultSinCasesStore(): SinCasesStore {
  const _store = new Map<string, SinCaseDto>();

  function getByKey(key: string): Promise<SinCaseDto | null> {
    return Promise.resolve(_store.get(key) ?? null);
  }

  function set(sinCase: SinCaseDto): Promise<boolean> {
    const key = sinCase.caseId;
    _store.set(key, sinCase);
    return Promise.resolve(true);
  }

  function _delete(key: string): Promise<boolean> {
    return Promise.resolve(_store.delete(key));
  }

  function listAllKeys(): Promise<string[]> {
    const keys = Array.from(_store.keys());
    return Promise.resolve(keys);
  }

  function listAll(): Promise<SinCaseDto[]> {
    const all = Array.from(Array.from(_store.values()));
    return Promise.resolve(all);
  }

  function has(key: string): Promise<boolean> {
    return Promise.resolve(_store.has(key));
  }

  function hasAny(): Promise<boolean> {
    return Promise.resolve(_store.size > 0);
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
