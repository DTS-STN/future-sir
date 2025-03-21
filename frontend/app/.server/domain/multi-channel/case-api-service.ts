import { getDefaultSinCaseService } from '~/.server/domain/multi-channel/case-api-service-default';
import { getMockSinCaseService } from '~/.server/domain/multi-channel/case-api-service-mock';
import type { PersonSinCase } from '~/.server/domain/multi-channel/case-api-service-models';
import { serverEnvironment } from '~/.server/environment';

export type SinCaseService = {
  getCases(): Promise<PersonSinCase[]>;
  getCaseById(id: string): Promise<PersonSinCase>;
};

export function getSinCaseService(): SinCaseService {
  return serverEnvironment.ENABLE_SIN_API_SERVICE_MOCK ? getMockSinCaseService() : getDefaultSinCaseService();
}
