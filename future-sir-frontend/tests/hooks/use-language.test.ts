import { useLocation } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { useLanguage } from '~/hooks/use-language';

vi.mock('react-router', () => ({
  useLocation: vi.fn(),
}));

describe('useLanguage', () => {
  it('should return the correct languages for a given pathname', () => {
    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: '/en/some-path' });
    expect(useLanguage()).toEqual({ currentLanguage: 'en', altLanguage: 'fr' });

    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: '/fr/some-path' });
    expect(useLanguage()).toEqual({ currentLanguage: 'fr', altLanguage: 'en' });
  });

  it('should return undefined for both languages if language cannot be determined', () => {
    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: '/some-route' });
    expect(useLanguage()).toEqual({ currentLanguage: undefined, altLanguage: undefined });
  });
});
