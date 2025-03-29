import { generateFakeHitListResults } from '~/.server/domain/multi-channel/search-api-faker';
import type { SearchResponse } from '~/.server/domain/multi-channel/search-api-models';
import type { SinSearchService } from '~/.server/domain/multi-channel/search-api-service';

export function getMockSinSearchService(): SinSearchService {
  return {
    getSearchResults: async (caseId: string): Promise<SearchResponse> => {
      return Promise.resolve(generateFakeHitListResults(20, 0));
    },
  };
}
