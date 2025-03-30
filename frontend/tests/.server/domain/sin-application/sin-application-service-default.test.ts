import { faker } from '@faker-js/faker';
import type { Client } from 'openapi-fetch';
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
import type { paths, components } from '~/.server/shared/api/fsir-openapi-schema';
import { interopClient } from '~/.server/shared/api/interop-client';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

// vi.mock has to have a factory function. Otherwise, it tries to import the original module,
// and if the original import has side effects, the tests will not work correctly.
// We then have to mock other things to ensure side effects in other files are handled.

vi.mock('~/.server/shared/api/interop', () => ({
  interopClient: mock<Client<paths>>(),
}));

vi.mock('~/.server/domain/sin-application/sin-application-mappers');

describe('getDefaultSinApplicationService', () => {
  const service = getDefaultSinApplicationService();
  const idTokenMock = faker.internet.jwt();

  describe('submitSinApplication', () => {
    let httpRequestMock: MockProxy<Request>;
    let submitSinApplicationRequestMock: MockProxy<SubmitSinApplicationRequest>;
    let sinApplicationRequestMappedMock: MockProxy<components['schemas']['SINApplicationRequest']>;
    let sinApplicationResponseMock: MockProxy<components['schemas']['SINApplicationResponse']>;
    let submitSinApplicationResponseMock: MockProxy<SubmitSinApplicationResponse>;

    beforeEach(() => {
      httpRequestMock = mock<Request>();
      submitSinApplicationRequestMock = mock<SubmitSinApplicationRequest>();
      sinApplicationRequestMappedMock = mock<components['schemas']['SINApplicationRequest']>();
      sinApplicationResponseMock = mock<components['schemas']['SINApplicationResponse']>();
      submitSinApplicationResponseMock = mock<SubmitSinApplicationResponse>({ identificationId: '123456789' });
    });

    it('should submit the SIN application and return the response data', async () => {
      const httpResponseMock = mock<Response>({ status: 200 });

      const interopClientPOST = vi.spyOn(interopClient, 'POST').mockResolvedValue({
        request: httpRequestMock,
        response: httpResponseMock,
        data: sinApplicationResponseMock,
      });

      vi.mocked(mapSubmitSinApplicationRequestToSinApplicationRequest).mockReturnValue(sinApplicationRequestMappedMock);
      vi.mocked(mapSinApplicationResponseToSubmitSinApplicationResponse).mockReturnValue(submitSinApplicationResponseMock);

      const result = await service.submitSinApplication(submitSinApplicationRequestMock, idTokenMock);

      expect(result).toEqual(submitSinApplicationResponseMock);
      expect(interopClientPOST).toHaveBeenCalledWith('/SINApplication', { body: sinApplicationRequestMappedMock });
      expect(mapSubmitSinApplicationRequestToSinApplicationRequest).toHaveBeenCalledWith(
        submitSinApplicationRequestMock,
        idTokenMock,
      );
      expect(mapSinApplicationResponseToSubmitSinApplicationResponse).toHaveBeenCalledWith(sinApplicationResponseMock);
    });

    it('should throw an AppError if the response data is undefined', async () => {
      const httpResponseMock = mock<Response>({
        status: 400,
        text: vi.fn().mockResolvedValue('Error content'),
      });

      vi.spyOn(interopClient, 'POST').mockResolvedValue({
        request: httpRequestMock,
        response: httpResponseMock,
        data: undefined,
        error: 'Sin Aplication Error',
      });

      await expect(service.submitSinApplication(submitSinApplicationRequestMock, idTokenMock)).rejects.toThrowError(AppError);
      await expect(service.submitSinApplication(submitSinApplicationRequestMock, idTokenMock)).rejects.toThrowError(
        expect.objectContaining({
          errorCode: ErrorCodes.SUBMIT_SIN_APPLICATION_FAILED,
          msg: `Failed to submit SIN application; status: ${httpResponseMock.status}; content: "Sin Aplication Error"`,
          name: 'AppError',
        }),
      );
    });
  });
});
