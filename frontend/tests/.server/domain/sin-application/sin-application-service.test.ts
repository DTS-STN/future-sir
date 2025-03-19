import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

import type { SinApplicationService } from '~/.server/domain/sin-application/sin-application-service';
import { getSinApplicationService } from '~/.server/domain/sin-application/sin-application-service';
import { getDefaultSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-default';
import { getMockSinApplicationService } from '~/.server/domain/sin-application/sin-application-service-mock';
import { serverEnvironment } from '~/.server/environment';

// vi.mock has to have a factory function. Otherwise, it tries to import the original module,
// and if the original import has side effects, the tests will not work correctly.
// We then have to mock other things to ensure side effects in other files are handled.

vi.mock('~/.server/domain/sin-application/sin-application-service-default', () => ({
  getDefaultSinApplicationService: vi.fn(),
}));

vi.mock('~/.server/domain/sin-application/sin-application-service-mock', () => ({
  getMockSinApplicationService: vi.fn(),
}));

vi.mock('~/.server/environment', () => ({
  serverEnvironment: {
    ENABLE_SIN_APPLICATION_SERVICE_MOCK: undefined,
  },
}));

describe('getSinApplicationService', () => {
  let sinApplicationServiceMock: MockProxy<SinApplicationService>;

  beforeEach(() => {
    sinApplicationServiceMock = mock<SinApplicationService>();
  });

  it('should return the default service when mock service is disabled', () => {
    const serverEnvironmentSpy = vi
      .spyOn(serverEnvironment, 'ENABLE_SIN_APPLICATION_SERVICE_MOCK', 'get')
      .mockReturnValueOnce(false);

    vi.mocked(getDefaultSinApplicationService).mockReturnValue(sinApplicationServiceMock);
    vi.mocked(getMockSinApplicationService);

    const result = getSinApplicationService();

    expect(result).toBe(sinApplicationServiceMock);
    expect(serverEnvironmentSpy).toHaveBeenCalledOnce();
    expect(getDefaultSinApplicationService).toHaveBeenCalledOnce();
    expect(getMockSinApplicationService).not.toHaveBeenCalled();
  });

  it('should return the mock service when mock service is enabled', () => {
    const serverEnvironmentSpy = vi
      .spyOn(serverEnvironment, 'ENABLE_SIN_APPLICATION_SERVICE_MOCK', 'get')
      .mockReturnValueOnce(true);

    vi.mocked(getDefaultSinApplicationService);
    vi.mocked(getMockSinApplicationService).mockReturnValue(sinApplicationServiceMock);

    const result = getSinApplicationService();

    expect(result).toBe(sinApplicationServiceMock);
    expect(serverEnvironmentSpy).toHaveBeenCalledOnce();
    expect(getDefaultSinApplicationService).not.toHaveBeenCalledOnce();
    expect(getMockSinApplicationService).toHaveBeenCalled();
  });
});
