import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({}) }),
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'future-sir',
    [ATTR_SERVICE_VERSION]: '0.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: 'localhost',
  }),
  traceExporter: new OTLPTraceExporter({}),
}).start();
