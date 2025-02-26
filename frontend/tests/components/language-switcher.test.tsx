import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';

vi.mock('~/i18n-routes', async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importActual<typeof import('~/i18n-routes')>();

  return {
    ...actual,

    i18nRoutes: [
      {
        id: 'ROUTE-0001',
        file: 'routes/index.tsx',
        paths: { en: '/en/:id', fr: '/fr/:id' },
      },
    ],
  };
});

describe('LanguageSwitcher', () => {
  it('should render a LanguageSwitcher with the correct props', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/en/:id',
        Component: () => <LanguageSwitcher>Français</LanguageSwitcher>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/en/00000000-0000-0000-0000-000000000000?foo=bar']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
