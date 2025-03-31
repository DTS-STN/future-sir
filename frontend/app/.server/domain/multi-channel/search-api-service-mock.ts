import { generateFakeHitListResults } from '~/.server/domain/multi-channel/search-api-faker';
import type { SearchResponse } from '~/.server/domain/multi-channel/search-api-models';
import type { SinSearchService } from '~/.server/domain/multi-channel/search-api-service';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

export function getMockSinSearchService(): SinSearchService {
  return {
    getSearchResults: async (caseId: string): Promise<SearchResponse> => {
      log.trace('Fetching hitlist search results with caseId: %s', caseId);

      const hitlistResponse = generateFakeHitListResults(20, 0);
      log.debug('Successfully retrieved hitlist results for caseId: %s; response: %j', caseId, hitlistResponse);
      return Promise.resolve(hitlistResponse);
    },
  };
}
