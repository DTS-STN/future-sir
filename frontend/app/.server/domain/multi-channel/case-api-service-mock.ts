import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { listAllSinCases, findSinCase } from '~/.server/domain/multi-channel/sin-cases-store';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Provides a mock implementation of the `SinCaseService`.
 * This service simulates fetching SIN cases by either returning stored cases
 * or generating a mock dataset if none exist.
 *
 * @returns An implementation of `SinCaseService` with mocked data.
 */
export function getMockSinCaseService(): SinCaseService {
  return {
    /**
     * Retrieves all SIN cases, generating mock data if necessary.
     *
     * @returns A promise resolving to an array of `SinCaseDto` objects.
     */
    async listAllSinCases(): Promise<SinCaseDto[]> {
      return await listAllSinCases();
    },

    /**
     * Retrieves a SIN case by its unique ID.
     * Returns `undefined` if the case does not exist.
     *
     * @param id - The unique identifier of the SIN case.
     * @returns A promise resolving to a `SinCaseDto` object or `undefined`.
     */
    async findSinCaseById(id: string): Promise<SinCaseDto | undefined> {
      return await findSinCase(id);
    },

    /**
     * Retrieves a SIN case by its unique ID.
     * Throws an `AppError` if the case does not exist.
     *
     * @param id - The unique identifier of the SIN case.
     * @returns A promise resolving to a `SinCaseDto` object.
     * @throws {AppError} If the case is not found, an error with code `SIN_CASE_NOT_FOUND` is thrown.
     */
    async getSinCaseById(id: string): Promise<SinCaseDto> {
      const sinCase = await findSinCase(id);

      if (!sinCase) {
        throw new AppError(`SIN case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
      }

      return sinCase;
    },
  };
}
