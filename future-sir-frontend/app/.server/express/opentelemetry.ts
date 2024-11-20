import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

new NodeSDK({ instrumentations: [getNodeAutoInstrumentations()] }).start();
