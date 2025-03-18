import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

import {
  mapSinApplicationResponseToSubmitSinApplicationResponse,
  mapSubmitSinApplicationRequestToSinApplicationRequest,
} from '~/.server/domain/sin-application/sin-application-mappers';
import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import { submitSinApplication } from '~/.server/domain/sin-application/sin-application-service';
import { sinapplication } from '~/.server/shared/api/interop';
import type { SinApplicationRequest, SinApplicationResponse } from '~/.server/shared/api/interop';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

vi.mock('~/.server/shared/api/interop');
vi.mock('~/.server/domain/sin-application/sin-application-mappers');

describe('submitSinApplication', () => {
  let mockHttpRequest: MockProxy<Request>;
  let mockRequest: MockProxy<SubmitSinApplicationRequest>;
  let mockMappedRequest: MockProxy<SinApplicationRequest>;
  let mockResponseData: MockProxy<SinApplicationResponse>;
  let mockMappedResponse: MockProxy<SubmitSinApplicationResponse>;

  beforeEach(() => {
    mockHttpRequest = mock<Request>();
    mockRequest = mock<SubmitSinApplicationRequest>();
    mockMappedRequest = mock<SinApplicationRequest>();
    mockResponseData = mock<SinApplicationResponse>();
    mockMappedResponse = mock<SubmitSinApplicationResponse>({ identificationId: 'IdentificationId' });
  });

  it('should submit the SIN application and return the response data', async () => {
    const mockHttpResponse = mock<Response>({ status: 200 });

    vi.mocked(sinapplication).mockResolvedValue({
      request: mockHttpRequest,
      response: mockHttpResponse,
      data: mockResponseData,
    });

    vi.mocked(mapSubmitSinApplicationRequestToSinApplicationRequest).mockReturnValue(mockMappedRequest);
    vi.mocked(mapSinApplicationResponseToSubmitSinApplicationResponse).mockReturnValue(mockMappedResponse);

    const result = await submitSinApplication(mockRequest);

    expect(sinapplication).toHaveBeenCalledWith({ body: mockMappedRequest });
    expect(mapSubmitSinApplicationRequestToSinApplicationRequest).toHaveBeenCalledWith(mockRequest);
    expect(mapSinApplicationResponseToSubmitSinApplicationResponse).toHaveBeenCalledWith(mockResponseData);
    expect(result).toEqual(mockMappedResponse);
  });

  it('should throw an AppError if the response data is undefined', async () => {
    const mockHttpResponse = mock<Response>({
      status: 400,
      text: vi.fn().mockResolvedValue('Error content'),
    });
    const mockError = new Error('AppError');

    vi.mocked(sinapplication).mockResolvedValue({
      request: mockHttpRequest,
      response: mockHttpResponse,
      data: undefined,
      error: mockError,
    });

    await expect(submitSinApplication(mockRequest)).rejects.toThrowError(AppError);
    await expect(submitSinApplication(mockRequest)).rejects.toThrowError(
      expect.objectContaining({
        errorCode: ErrorCodes.SUBMIT_SIN_APPLICATION_FAILED,
        msg: `Failed to submit SIN application; stastus: ${mockHttpResponse.status}; content: Error content`,
        name: 'AppError',
      }),
    );
  });
});
