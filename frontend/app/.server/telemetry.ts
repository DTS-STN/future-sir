/*
 * Initializes the OpenTelemetry SDK for the application.
 *
 * This file configures and starts the OpenTelemetry SDK to enable observability for the application.
 * By default, it is configured to periodically emit metrics and traces to the endpoints
 * specified in the server environment variables `OTEL_METRICS_ENDPOINT` and `OTEL_TRACES_ENDPOINT`.
 *
 * If these environment variables are not set, the SDK will attempt to send data to the default
 * OpenTelemetry Collector endpoint, which is often http://localhost:4318/v1/metrics and
 * http://localhost:4318/v1/traces for metrics and traces respectively.
 *
 * The service name, service version, and deployment environment are also configured using
 * environment variables from `serverEnvironment`.
 */
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { AggregationTemporality, ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

log.info('Initializing OpenTelemetry SDK...');

if (serverEnvironment.OTEL_DEBUG) {
  log.info('Enabling OpenTelemetry diagnostics logging');
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
}

const nodeSdk = new NodeSDK({
  resource: resourceFromAttributes({
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
    exporter: serverEnvironment.OTEL_USE_CONSOLE_METRIC_EXPORTER
      ? new ConsoleMetricExporter()
      : new OTLPMetricExporter({
          url: serverEnvironment.OTEL_METRICS_ENDPOINT,
          compression: CompressionAlgorithm.GZIP,
          headers: { authorization: serverEnvironment.OTEL_AUTH_HEADER.value() },
          temporalityPreference: AggregationTemporality.DELTA, // req'd by dynatrace
        }),
  }),

  traceExporter: serverEnvironment.OTEL_USE_CONSOLE_TRACE_EXPORTER
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({
        url: serverEnvironment.OTEL_TRACES_ENDPOINT,
        compression: CompressionAlgorithm.GZIP,
        headers: { authorization: serverEnvironment.OTEL_AUTH_HEADER.value() },
      }),
});

log.info('OpenTelemetry SDK initialization complete; starting instrumentation');
nodeSdk.start();

process.on('SIGTERM', () => {
  log.info('Shutting down OpenTelemetry SDK');
  nodeSdk.shutdown().catch((error) => log.error('Error while shutting down OpenTelemetry SDK', error));
});
