import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';
import { Redacted } from 'effect';

import { getServerEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);
const environment = getServerEnvironment();

log.info('Initializing OpenTelemetry SDK...');

const nodeSdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: environment.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: environment.OTEL_SERVICE_VERSION,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: environment.OTEL_ENVIRONMENT_NAME,
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      // winston auto-instrumentation adds a lot of unwanted attributes to the logs
      '@opentelemetry/instrumentation-winston': { enabled: false },
    }),
  ],

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: environment.OTEL_METRICS_ENDPOINT,
      compression: CompressionAlgorithm.GZIP,
      headers: { authorization: Redacted.value(environment.OTEL_AUTH_HEADER) },
    }),
  }),

  traceExporter: new OTLPTraceExporter({
    url: environment.OTEL_TRACES_ENDPOINT,
    compression: CompressionAlgorithm.GZIP,
    headers: { authorization: Redacted.value(environment.OTEL_AUTH_HEADER) },
  }),
});

log.info('OpenTelemetry SDK initialization complete; starting instrumentation');
nodeSdk.start();
