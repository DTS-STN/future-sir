import * as TestingLibrary from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  // disable logging so we don't pollute the output
  vi.stubEnv('LOG_LEVEL', 'none');
});

afterEach(() => {
  vi.resetAllMocks();
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
