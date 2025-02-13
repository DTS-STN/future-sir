import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';

describe('LanguageSwitcher', () => {
  it('should render a LanguageSwitcher with the correct props', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <LanguageSwitcher>English</LanguageSwitcher>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
