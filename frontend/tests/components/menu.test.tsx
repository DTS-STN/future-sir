import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Menu, MenuItem } from '~/components/menu';

describe('Menu', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should correctly render a Menu with a MenuItem when the file property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <MenuItem file="routes/public/index.tsx">This is a test</MenuItem>,
      },
    ]);

    const { container } = render(<Menu><RoutesStub initialEntries={['/fr/public']} /></Menu>);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should correctly render a Menu with a MenuItem when the to property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <MenuItem to="https://example.com/">This is a test</MenuItem>,
      },
    ]);

    const { container } = render(<Menu><RoutesStub initialEntries={['/fr/public']} /></Menu>);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
