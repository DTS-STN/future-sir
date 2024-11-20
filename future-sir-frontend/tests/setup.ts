import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();

  vi.spyOn(console, 'debug').mockRestore();
  vi.spyOn(console, 'error').mockRestore();
  vi.spyOn(console, 'info').mockRestore();
  vi.spyOn(console, 'log').mockRestore();
  vi.spyOn(console, 'warn').mockRestore();

  cleanup();
});
