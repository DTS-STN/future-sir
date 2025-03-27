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
import { getDefaultSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-default';
import { sinapplication } from '~/.server/shared/api/interop';
import type { SinApplicationRequest, SinApplicationResponse } from '~/.server/shared/api/interop';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

// vi.mock has to have a factory function. Otherwise, it tries to import the original module,
// and if the original import has side effects, the tests will not work correctly.
// We then have to mock other things to ensure side effects in other files are handled.

vi.mock('~/.server/shared/api/interop', () => ({
  sinapplication: vi.fn(),
}));

vi.mock('~/.server/domain/sin-application/sin-application-mappers');

describe('getDefaultSinApplicationService', () => {
  const service = getDefaultSinApplicationService();

  describe('submitSinApplication', () => {
    let httpRequestMock: MockProxy<Request>;
    let submitSinApplicationRequestMock: MockProxy<SubmitSinApplicationRequest>;
    let sinApplicationRequestMappedMock: MockProxy<SinApplicationRequest>;
    let sinApplicationResponseMock: MockProxy<SinApplicationResponse>;
    let submitSinApplicationResponseMock: MockProxy<SubmitSinApplicationResponse>;

    beforeEach(() => {
      httpRequestMock = mock<Request>();
      submitSinApplicationRequestMock = mock<SubmitSinApplicationRequest>();
      sinApplicationRequestMappedMock = mock<SinApplicationRequest>();
      sinApplicationResponseMock = mock<SinApplicationResponse>();
      submitSinApplicationResponseMock = mock<SubmitSinApplicationResponse>({ identificationId: '123456789' });
    });

    it('should submit the SIN application and return the response data', async () => {
      const httpResponseMock = mock<Response>({ status: 200 });

      vi.mocked(sinapplication).mockResolvedValue({
        request: httpRequestMock,
        response: httpResponseMock,
        data: sinApplicationResponseMock,
      });

      vi.mocked(mapSubmitSinApplicationRequestToSinApplicationRequest).mockReturnValue(sinApplicationRequestMappedMock);
      vi.mocked(mapSinApplicationResponseToSubmitSinApplicationResponse).mockReturnValue(submitSinApplicationResponseMock);

      const result = await service.submitSinApplication(submitSinApplicationRequestMock);

      expect(result).toEqual(submitSinApplicationResponseMock);
      expect(sinapplication).toHaveBeenCalledWith({ body: sinApplicationRequestMappedMock });
      expect(mapSubmitSinApplicationRequestToSinApplicationRequest).toHaveBeenCalledWith(submitSinApplicationRequestMock);
      expect(mapSinApplicationResponseToSubmitSinApplicationResponse).toHaveBeenCalledWith(sinApplicationResponseMock);
    });

    it('should throw an AppError if the response data is undefined', async () => {
      const httpResponseMock = mock<Response>({
        status: 400,
        text: vi.fn().mockResolvedValue('Error content'),
      });

      vi.mocked(sinapplication).mockResolvedValue({
        request: httpRequestMock,
        response: httpResponseMock,
        data: undefined,
        error: 'Sin Aplication Error',
      });

      await expect(service.submitSinApplication(submitSinApplicationRequestMock)).rejects.toThrowError(AppError);
      await expect(service.submitSinApplication(submitSinApplicationRequestMock)).rejects.toThrowError(
        expect.objectContaining({
          errorCode: ErrorCodes.SUBMIT_SIN_APPLICATION_FAILED,
          msg: `Failed to submit SIN application; status: ${httpResponseMock.status}; content: Sin Aplication Error`,
          name: 'AppError',
        }),
      );
    });
  });
});
