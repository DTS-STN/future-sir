import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { serverEnvironment } from '~/.server/environment';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';

export function getDefaultSinCaseService(): SinCaseService {
  return {
    listAllSinCases: async (): Promise<SinCaseDto[]> => {
      const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases`);

      if (!response.ok) {
        const errorMessage = `Failed to retrieve all SIN cases. Server responded with status ${response.status}.`;
        throw new AppError(errorMessage, ErrorCodes.XAPI_API_ERROR);
      }

      return await response.json();
    },

    findSinCaseById: async (id: string): Promise<SinCaseDto | undefined> => {
      const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases/${id}`);

      if (response.status === HttpStatusCodes.NOT_FOUND) {
        return undefined;
      }

      if (!response.ok) {
        const errorMessage = `Failed to find SIN case with ID '${id}'. Server responded with status ${response.status}.`;
        throw new AppError(errorMessage, ErrorCodes.XAPI_API_ERROR);
      }

      return await response.json();
    },

    getSinCaseById: async (id: string): Promise<SinCaseDto> => {
      const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases/${id}`);

      if (response.status === HttpStatusCodes.NOT_FOUND) {
        throw new AppError(`SIN case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      }

      if (!response.ok) {
        const errorMessage = `Failed to get SIN case with ID '${id}'. Server responded with status ${response.status}.`;
        throw new AppError(errorMessage, ErrorCodes.XAPI_API_ERROR);
      }

      return await response.json();
    },
  };
}
