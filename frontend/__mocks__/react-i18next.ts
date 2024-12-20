import { vi } from 'vitest';

export const useTranslation = vi.fn(() => ({
  t: (key: string) => key,
  i18n: { getFixedT: vi.fn((lang: string) => (key: string) => key) },
}));
