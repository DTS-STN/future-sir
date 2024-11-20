import { z } from 'zod';

import { redact } from '~/utils/validation-utils';

export type Telemetry = Readonly<z.infer<typeof telemetry>>;

export const telemetry = z.object({
  OTEL_SERVICE_NAME: z.string().default('Future SIR frontend'),
  OTEL_SERVICE_VERSION: z.string().default('0.0.0'),
  OTEL_ENVIRONMENT_NAME: z.string().default('localhost'),
  OTEL_AUTH_HEADER: redact(z.string().default('Authorization 00000000-0000-0000-0000-000000000000')),
  OTEL_METRICS_ENDPOINT: z.string().default('http://localhost:4318/v1/metrics'),
  OTEL_TRACES_ENDPOINT: z.string().default('http://localhost:4318/v1/traces'),
});
