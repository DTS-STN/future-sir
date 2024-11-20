import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

/**
 * Gets the environment variable value, falling back to a default value if the environment variable is not set or is empty.
 */
function getEnvValue(defaultValue: string, envVar?: string): string {
  return envVar && envVar !== '' ? envVar : defaultValue;
}

new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-winston': { enabled: false } })],
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({}) }),
  resource: new Resource({
    [ATTR_SERVICE_NAME]: getEnvValue('Future SIR frontend', process.env.APPLICATION_NAME),
    [ATTR_SERVICE_VERSION]: getEnvValue('0.0.0', process.env.APPLICATION_VERSION),
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: getEnvValue('localhost', process.env.ENVIRONMENT_NAME),
  }),
  traceExporter: new OTLPTraceExporter({}),
}).start();
