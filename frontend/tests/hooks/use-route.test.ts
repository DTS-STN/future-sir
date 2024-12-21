import { useLocation } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { useRoute } from '~/hooks/use-route';

vi.mock('react-router', () => ({
  useLocation: vi.fn(),
}));

describe('useRoute', () => {
  it('should return the correct route for a given pathname', () => {
    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: '/en/public' });
    expect(useRoute()).toEqual(
      expect.objectContaining({
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      }),
    );
  });
});