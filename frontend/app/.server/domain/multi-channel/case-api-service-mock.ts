import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import { generateMockSinCases } from '~/.server/domain/multi-channel/case-api-service-mock-utils';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

let mockSinCases: SinCaseDto[] | undefined;

export function getMockSinCaseService(): SinCaseService {
  return {
    getSinCases(): Promise<SinCaseDto[]> {
      mockSinCases ??= generateMockSinCases();
      return Promise.resolve(mockSinCases);
    },

    getSinCaseById(id: string): Promise<SinCaseDto> {
      mockSinCases ??= generateMockSinCases();
      const sincCase = mockSinCases.find(({ caseId }) => caseId === id);

      if (!sincCase) {
        throw new AppError(`Case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      }

      return Promise.resolve(sincCase);
    },
  };
}
