import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipNavigationLinks } from '~/components/skip-navigation-links';

describe('SkipNavigationLinks', () => {
  it('renders skip links', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/fr/public',
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
