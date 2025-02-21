import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

log.info('Initializing OpenTelemetry SDK...');

const nodeSdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: serverEnvironment.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: serverEnvironment.OTEL_SERVICE_VERSION,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: serverEnvironment.OTEL_ENVIRONMENT_NAME,
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      // winston auto-instrumentation adds a lot of unwanted attributes to the logs
      '@opentelemetry/instrumentation-winston': { enabled: false },
    }),
  ],

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: serverEnvironment.OTEL_METRICS_ENDPOINT,
      compression: CompressionAlgorithm.GZIP,
      headers: { authorization: serverEnvironment.OTEL_AUTH_HEADER.value() },
    }),
  }),

  traceExporter: new OTLPTraceExporter({
    url: serverEnvironment.OTEL_TRACES_ENDPOINT,
    compression: CompressionAlgorithm.GZIP,
    headers: { authorization: serverEnvironment.OTEL_AUTH_HEADER.value() },
  }),
});

log.info('OpenTelemetry SDK initialization complete; starting instrumentation');
nodeSdk.start();
