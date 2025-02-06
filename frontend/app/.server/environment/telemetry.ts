import { Redacted } from 'effect';
import * as v from 'valibot';

export type Telemetry = Readonly<v.InferOutput<typeof telemetry>>;

export const defaults = {
  OTEL_SERVICE_NAME: 'future-sir-frontend',
  OTEL_SERVICE_VERSION: '0.0.0',
  OTEL_ENVIRONMENT_NAME: 'localhost',
  OTEL_AUTH_HEADER: 'Authorization 00000000-0000-0000-0000-000000000000',
  OTEL_METRICS_ENDPOINT: 'http://localhost:4318/v1/metrics',
  OTEL_TRACES_ENDPOINT: 'http://localhost:4318/v1/traces',
} as const;

export const telemetry = v.object({
  OTEL_SERVICE_NAME: v.optional(v.string(), defaults.OTEL_SERVICE_NAME),
  OTEL_SERVICE_VERSION: v.optional(v.string(), defaults.OTEL_SERVICE_VERSION),
  OTEL_ENVIRONMENT_NAME: v.optional(v.string(), defaults.OTEL_ENVIRONMENT_NAME),
  OTEL_AUTH_HEADER: v.pipe(v.optional(v.string(), defaults.OTEL_AUTH_HEADER), v.transform(Redacted.make)),
  OTEL_METRICS_ENDPOINT: v.optional(v.string(), defaults.OTEL_METRICS_ENDPOINT),
  OTEL_TRACES_ENDPOINT: v.optional(v.string(), defaults.OTEL_TRACES_ENDPOINT),
});
