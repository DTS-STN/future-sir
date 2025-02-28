import type { SinApplicationRequest, SinApplicationResponse } from '~/.server/shared/api';
import * as api from '~/.server/shared/api';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

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

export async function submitSinApplication(
  submitSinApplicationRequest: SinApplicationRequest,
): Promise<SinApplicationResponse> {
  const { response, data } = await api.submitSinApplication({ body: submitSinApplicationRequest });

  if (data === undefined) {
    const content = await response.text();
    throw new AppError(
      `Failed to submit SIN application; stastus: ${response.status}; content: ${content}`,
      ErrorCodes.FAILED_SUBMIT_SIN_APPLICATION,
    );
  }

  return data;
}
