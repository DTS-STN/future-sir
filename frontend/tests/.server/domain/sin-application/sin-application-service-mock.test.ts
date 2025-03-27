import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { SubmitSinApplicationRequest } from '~/.server/domain/sin-application/sin-application-models';
import { getMockSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-mock';

vi.mock('~/utils/string-utils');

describe('getMockSinApplicationService', () => {
  const service = getMockSinApplicationService();
  const idTokenMock = faker.internet.jwt();

  describe('submitSinApplication', () => {
    let mockRequest: MockProxy<SubmitSinApplicationRequest>;

    beforeEach(() => {
      mockRequest = mock<SubmitSinApplicationRequest>();
    });

    it('should mock submitting the SIN application and return the mock response data', async () => {
      const result = await service.submitSinApplication(mockRequest, idTokenMock);
      expect(result.identificationId).not.toBeUndefined();
    });
  });
});
