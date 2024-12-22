import { createRoutesStub, useRouteError } from 'react-router';

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLink } from '~/components/app-link';
import type { AppError } from '~/errors/app-error';

describe('AppLink', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders a link with a specified language when provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/',
        Component: () => (
          <AppLink file="routes/public/index.tsx" lang="en">
            This is a test
          </AppLink>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/']} />);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('renders a link with the current language if no specific language is provided', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <AppLink file="routes/public/index.tsx">This is a test</AppLink>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('throws an error if no language is available', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/',
        Component: () => <AppLink file="routes/public/index.tsx">This is a test</AppLink>,
        ErrorBoundary: () => <>{(useRouteError() as AppError).msg}</>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/']} />);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
