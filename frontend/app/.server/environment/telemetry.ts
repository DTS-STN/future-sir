import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

export type Telemetry = Readonly<z.infer<typeof telemetry>>;

export const defaults = {
  OTEL_SERVICE_NAME: 'Future SIR frontend',
  OTEL_SERVICE_VERSION: '0.0.0',
  OTEL_ENVIRONMENT_NAME: 'localhost',
  OTEL_AUTH_HEADER: 'Authorization 00000000-0000-0000-0000-000000000000',
  OTEL_METRICS_ENDPOINT: 'http://localhost:4318/v1/metrics',
  OTEL_TRACES_ENDPOINT: 'http://localhost:4318/v1/traces',
} as const;

export const telemetry = z.object({
  OTEL_SERVICE_NAME: z.string().default(defaults.OTEL_SERVICE_NAME),
  OTEL_SERVICE_VERSION: z.string().default(defaults.OTEL_SERVICE_VERSION),
  OTEL_ENVIRONMENT_NAME: z.string().default(defaults.OTEL_ENVIRONMENT_NAME),
  OTEL_AUTH_HEADER: ValidationUtils.redact(z.string().default(defaults.OTEL_AUTH_HEADER)),
  OTEL_METRICS_ENDPOINT: z.string().default(defaults.OTEL_METRICS_ENDPOINT),
  OTEL_TRACES_ENDPOINT: z.string().default(defaults.OTEL_TRACES_ENDPOINT),
});
