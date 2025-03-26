import { randomUUID } from 'node:crypto';

import { setSinCases } from '~/.server/domain/multi-channel/sin-cases-store';
import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import type { SinApplicationService } from '~/.server/domain/sin-application/sin-application-service';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

export function getMockSinApplicationService(): SinApplicationService {
  return {
    submitSinApplication(submitSinApplicationRequest: SubmitSinApplicationRequest): Promise<SubmitSinApplicationResponse> {
      log.debug('Submitting SIN application request.');
      log.trace('Submitting SIN application with request:', submitSinApplicationRequest);

      const caseId = randomUUID();

      // TODO ::: GjB ::: maybe remove after demo?
      void setSinCases({ ...submitSinApplicationRequest, caseId: caseId });

      const mockSubmitSinApplicationResponse = { identificationId: caseId };
      log.debug('SIN application submitted successfully with response: %s', mockSubmitSinApplicationResponse);
      return Promise.resolve(mockSubmitSinApplicationResponse);
    },
  };
}
