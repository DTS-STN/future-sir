import { getDefaultSinCaseService } from '~/.server/domain/multi-channel/case-api-service-default';
import { getMockSinCaseService } from '~/.server/domain/multi-channel/case-api-service-mock';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { serverEnvironment } from '~/.server/environment';

export type SinCaseService = {
  listAllSinCases(): Promise<SinCaseDto[]>;
  findSinCaseById(id: string): Promise<SinCaseDto | undefined>;
  getSinCaseById(id: string): Promise<SinCaseDto>;
};

export function getSinCaseService(): SinCaseService {
  return serverEnvironment.ENABLE_SIN_CASE_SERVICE_MOCK ? getMockSinCaseService() : getDefaultSinCaseService();
}
