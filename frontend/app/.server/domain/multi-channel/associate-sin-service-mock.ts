import { generateFakeAssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-faker';
import type { AssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-models';
import type { AssociateSinService } from '~/.server/domain/multi-channel/associate-sin-service';

export function getMockAssociateSinService(): AssociateSinService {
  return {
    getAssociatedSin: async (caseId: string): Promise<AssociateSinResponse> => {
      return Promise.resolve(generateFakeAssociateSinResponse());
    },
  };
}
