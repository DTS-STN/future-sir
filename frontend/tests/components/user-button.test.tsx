import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MenuItem } from '~/components/menu';
import { UserButton } from '~/components/user-button';

describe('UserButton', () => {
  it('should correctly render a UserButton with no MenuItems provided', () => {
    const { container } = render(<UserButton name="Test Name" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should correctly render a UserButton with a MenuItem when the file property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <UserButton name="Test Name">
            <MenuItem file="routes/public/index.tsx">This is a test</MenuItem>
          </UserButton>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

    expect(container).toMatchSnapshot('expected html');
  });

  it('should correctly render a UserButton with a MenuItem when the to property is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <UserButton name="Test Name">
            <MenuItem to="https://example.com/">This is a test</MenuItem>
          </UserButton>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']}></RoutesStub>);

    expect(container).toMatchSnapshot('expected html');
  });
});
