import { generateFakeHitListResults } from '~/.server/domain/multi-channel/search-api-faker';
import type { HitListResult } from '~/.server/domain/multi-channel/search-api-models';
import type { SinSearchService } from '~/.server/domain/multi-channel/search-api-service';

export function getMockSinSearchService(): SinSearchService {
  return {
    getSearchResults: async (caseId: string): Promise<HitListResult[]> => {
      return Promise.resolve(generateFakeHitListResults(20, 0));
    },
  };
}
