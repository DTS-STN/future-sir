import { generateFakeAssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-faker';
import type { AssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-models';
import type { AssociateSinService } from '~/.server/domain/multi-channel/associate-sin-service';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

export function getMockAssociateSinService(): AssociateSinService {
  return {
    getAssociatedSin: async (caseId: string): Promise<AssociateSinResponse> => {
      log.trace('Fetching associated SIN with caseId: %s', caseId);

      const associatedSinResponse = generateFakeAssociateSinResponse();
      log.debug('Successfully retrieved associated SIN for caseId: %s; response: %j', caseId, associatedSinResponse);
      return Promise.resolve(associatedSinResponse);
    },
  };
}
