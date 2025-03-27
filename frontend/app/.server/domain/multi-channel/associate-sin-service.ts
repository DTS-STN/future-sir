import type { AssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-models';
import { getDefaultAssociateSinService } from '~/.server/domain/multi-channel/associate-sin-service-default';
import { getMockAssociateSinService } from '~/.server/domain/multi-channel/associate-sin-service-mock';
import { serverEnvironment } from '~/.server/environment';

export type AssociateSinService = {
  getAssociatedSin(caseId: string): Promise<AssociateSinResponse>;
};

export function getAssociateSinService(): AssociateSinService {
  return serverEnvironment.ENABLE_ASSOCIATE_SIN_SERVICE_MOCK ? getMockAssociateSinService() : getDefaultAssociateSinService();
}
