import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Menu, MenuItem } from '~/components/menu';

describe('Menu', () => {
  it('should correctly render a Menu with a MenuItem when the file property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Menu>
            <MenuItem file="routes/public/index.tsx">This is a test</MenuItem>
          </Menu>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

    expect(container).toMatchSnapshot('expected html');
  });

  it('should correctly render a Menu with a MenuItem when the to property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Menu>
            <MenuItem to="https://example.com/">This is a test</MenuItem>
          </Menu>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']}></RoutesStub>);

    expect(container).toMatchSnapshot('expected html');
  });
});
