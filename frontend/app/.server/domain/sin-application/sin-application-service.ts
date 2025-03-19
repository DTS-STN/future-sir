import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import { getDefaultSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-default';
import { getMockSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-mock';
import { serverEnvironment } from '~/.server/environment';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AppError } from '~/errors/app-error';

export type SinApplicationService = {
  /**
 * Submits a SIN application using the provided request data.
 *
 * This function sends a SIN application request to the backend API and handles the response.
 * If the API call is successful, it returns the parsed response data.
 * If the API call fails (e.g., non-2xx status code or missing data), it throws an `AppError`
 * with details about the failure.

 * @param submitSinApplicationRequest - The request data for the SIN application.
 * @returns A promise that resolves with the SIN application response data.
 * @throws {AppError} If the API call fails or the response data is missing.
 */
  submitSinApplication(submitSinApplicationRequest: SubmitSinApplicationRequest): Promise<SubmitSinApplicationResponse>;
};

export function getSinApplicationService(): SinApplicationService {
  return serverEnvironment.ENABLE_SIN_APPLICATION_SERVICE_MOCK //
    ? getMockSinApplicationService()
    : getDefaultSinApplicationService();
}
