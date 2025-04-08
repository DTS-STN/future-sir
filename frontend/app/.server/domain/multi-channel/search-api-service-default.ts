import type { SearchResponse } from '~/.server/domain/multi-channel/search-api-models';
import type { SinSearchService } from '~/.server/domain/multi-channel/search-api-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { powerPlatformClient } from '~/.server/shared/api/interop-client';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';

const log = LogFactory.getLogger(import.meta.url);

export function getDefaultSearchService(): SinSearchService {
  return {
    getSearchResults: async (caseId: string): Promise<SearchResponse> => {
      log.trace('Fetching hitlist search results with caseId: %s', caseId);

      const { response, data, error } = await powerPlatformClient.POST('/search', {
        body: {
          caseGuid: caseId,
          idToken: serverEnvironment.TMP_AWS_ID_TOKEN.value(),
        },
      });

      if (response.status === HttpStatusCodes.NOT_FOUND) {
        log.debug('No hitlist results found for caseId: %s', caseId);
        return {};
      }

      if (data === undefined) {
        log.error(
          'Failed to retrieve hitlist results for caseId: %s; status: %s; error: %s',
          caseId,
          response.status,
          JSON.stringify(error),
        );
        throw new AppError(`Search results for case ID '${caseId}' not found.`, ErrorCodes.SEARCH_RESULTS_NOT_FOUND);
      }

      log.debug('Successfully retrieved hitlist results for caseId: %s; response: %j', caseId, data);
      return data;
    },
  };
}
