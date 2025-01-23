import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@opentelemetry/sdk-node');
vi.mock('@opentelemetry/resources');
vi.mock('@opentelemetry/sdk-metrics');
vi.mock('@opentelemetry/auto-instrumentations-node');
vi.mock('@opentelemetry/exporter-metrics-otlp-proto');
vi.mock('@opentelemetry/exporter-trace-otlp-proto');

vi.mock('effect', () => ({
  Redacted: { value: vi.fn((val) => val) },
}));

vi.mock('~/.server/environment', () => ({
  serverEnvironment: {
    OTEL_SERVICE_NAME: 'service',
    OTEL_SERVICE_VERSION: '1.0.0',
    OTEL_ENVIRONMENT_NAME: 'test',
    OTEL_METRICS_ENDPOINT: 'http://metrics.example.com/',
    OTEL_TRACES_ENDPOINT: 'http://traces.example.com',
    OTEL_AUTH_HEADER: 'Api-Key Sleep-Token',
  },
}));

describe('NodeSDK', () => {
  it('should create a NodeSDK instance with the correct configuration', async () => {
    await import('~/.server/opentelemetry');

    expect(NodeSDK).toHaveBeenCalledWith({
      resource: expect.any(Resource),
      instrumentations: expect.any(Array),
      metricReader: expect.any(PeriodicExportingMetricReader),
      traceExporter: expect.any(OTLPTraceExporter),
    });
  });

  it('should configure the Resource with correct attributes', async () => {
    await import('~/.server/opentelemetry');

    expect(Resource).toHaveBeenCalledWith({
      [ATTR_SERVICE_NAME]: 'service',
      [ATTR_SERVICE_VERSION]: '1.0.0',
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: 'test',
    });
  });

  it('should configure the OTLPMetricExporter correctly', async () => {
    await import('~/.server/opentelemetry');

    expect(OTLPMetricExporter).toHaveBeenCalledWith({
      url: 'http://metrics.example.com/',
      compression: CompressionAlgorithm.GZIP,
      headers: { authorization: 'Api-Key Sleep-Token' },
    });
  });

  it('should configure the OTLPTraceExporter correctly', async () => {
    await import('~/.server/opentelemetry');

    expect(OTLPTraceExporter).toHaveBeenCalledWith({
      url: 'http://traces.example.com',
      compression: CompressionAlgorithm.GZIP,
      headers: { authorization: 'Api-Key Sleep-Token' },
    });
  });

  it('should configure auto-instrumentations with Winston disabled', async () => {
    await import('~/.server/opentelemetry');

    expect(getNodeAutoInstrumentations).toHaveBeenCalledWith({
      '@opentelemetry/instrumentation-winston': { enabled: false },
    });
  });

  it('should start the NodeSDK', async () => {
    await import('~/.server/opentelemetry');

    const instance = vi.mocked(NodeSDK).mock.instances[0];
    expect(instance.start).toHaveBeenCalled();
  });
});
