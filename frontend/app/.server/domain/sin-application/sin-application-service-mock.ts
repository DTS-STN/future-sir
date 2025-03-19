import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import type { SinApplicationService } from '~/.server/domain/sin-application/sin-application-service';
import { LogFactory } from '~/.server/logging';
import { randomString } from '~/utils/string-utils';

const log = LogFactory.getLogger(import.meta.url);

export function getMockSinApplicationService(): SinApplicationService {
  return {
    submitSinApplication(submitSinApplicationRequest: SubmitSinApplicationRequest): Promise<SubmitSinApplicationResponse> {
      log.debug('Submitting SIN application request.');
      log.trace('Submitting SIN application with request:', submitSinApplicationRequest);
      const mockSubmitSinApplicationResponse: SubmitSinApplicationResponse = {
        identificationId: randomString(9, '0123456789'),
      };
      log.debug('SIN application submitted successfully with response: %s', mockSubmitSinApplicationResponse);
      return Promise.resolve(mockSubmitSinApplicationResponse);
    },
  };
}
