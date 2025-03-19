import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import { getMockSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-mock';
import { randomString } from '~/utils/string-utils';

vi.mock('~/utils/string-utils');

describe('getMockSinApplicationService', () => {
  const service = getMockSinApplicationService();

  describe('submitSinApplication', () => {
    let mockRequest: MockProxy<SubmitSinApplicationRequest>;

    beforeEach(() => {
      mockRequest = mock<SubmitSinApplicationRequest>();
    });

    it('should mock submitting the SIN application and return the mock response data', async () => {
      const identificationIdMock = '123456789';

      vi.mocked(randomString).mockReturnValueOnce(identificationIdMock);

      const expected: SubmitSinApplicationResponse = { identificationId: identificationIdMock };

      const result = await service.submitSinApplication(mockRequest);

      expect(result).toEqual(expected);
      expect(randomString).toHaveBeenCalledExactlyOnceWith(9, '0123456789');
      expect(randomString).toHaveReturnedWith(identificationIdMock);
    });
  });
});
