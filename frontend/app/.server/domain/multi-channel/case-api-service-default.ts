import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import type { PersonSinCase } from '~/.server/domain/multi-channel/case-api-service-models';
import { serverEnvironment } from '~/.server/environment';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export function getDefaultSinCaseService(): SinCaseService {
  return {
    getCases: async (): Promise<PersonSinCase[]> => {
      const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases`);
      if (!response.ok) throw new AppError(`Cases not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      return response.json();
    },

    getCaseById: async (id: string): Promise<PersonSinCase> => {
      const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases/${id}`);
      if (!response.ok) throw new AppError(`Case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      return response.json();
    },
  };
}
