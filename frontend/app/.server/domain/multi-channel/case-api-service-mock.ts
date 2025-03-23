import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import { generateMockSinCases } from '~/.server/domain/multi-channel/case-api-service-mock-utils';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { getSinCasesStore } from '~/.server/domain/multi-channel/sin-case-store';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export function getMockSinCaseService(): SinCaseService {
  const store = getSinCasesStore();
  const storeKey = 'dataset';

  async function getData(): Promise<SinCaseDto[]> {
    const hasData = await store.has(storeKey);

    if (hasData) {
      const data = await store.get(storeKey);

      if (data === undefined) {
        throw Error('Something went wrong!');
      }

      return data;
    }

    // init dataset
    const generatedDataset = generateMockSinCases();
    await store.set(storeKey, generatedDataset);
    return generateMockSinCases();
  }

  return {
    async getSinCases(): Promise<SinCaseDto[]> {
      const data = await getData();
      return Promise.resolve(data);
    },

    async getSinCaseById(id: string): Promise<SinCaseDto> {
      const data = await getData();
      const sincCase = data.find(({ caseId }) => caseId === id);

      if (!sincCase) {
        throw new AppError(`Case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      }

      return Promise.resolve(sincCase);
    },
  };
}
