import type { HitListResult } from '~/.server/domain/multi-channel/search-api-models';
import { getDefaultSearchService } from '~/.server/domain/multi-channel/search-api-service-default';
import { getMockSinSearchService } from '~/.server/domain/multi-channel/search-api-service-mock';
import { serverEnvironment } from '~/.server/environment';

export type SinSearchService = {
  getSearchResults(caseId: string): Promise<HitListResult[]>;
};

export function getSinSearchService(): SinSearchService {
  return serverEnvironment.ENABLE_SIN_SEARCH_SERVICE_MOCK ? getMockSinSearchService() : getDefaultSearchService();
}
