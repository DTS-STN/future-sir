import * as TestingLibrary from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.mock('react-i18next');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();

  vi.spyOn(console, 'debug').mockRestore();
  vi.spyOn(console, 'error').mockRestore();
  vi.spyOn(console, 'info').mockRestore();
  vi.spyOn(console, 'log').mockRestore();
  vi.spyOn(console, 'warn').mockRestore();

  TestingLibrary.cleanup();
});
