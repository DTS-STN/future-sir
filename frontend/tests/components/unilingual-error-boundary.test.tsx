import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UnilingualErrorBoundary } from '~/components/unilingual-error-boundary';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

describe('UnilingualErrorBoundary', () => {
  it('should render the unilingual error boundary when it catches a generic error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/en',
        Component: () => <UnilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
      },
    ]);

    render(<RoutesStub initialEntries={['/en']} />);

    expect(document.documentElement).toMatchSnapshot('expected html');
  });

  it('should render the unilingual error boundary when it catches an AppError', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/en',
        Component: () => (
          <UnilingualErrorBoundary
            params={{}}
            error={new AppError('Something went wrong', ErrorCodes.UNCAUGHT_ERROR, { correlationId: 'XX-000000' })}
          />
        ),
      },
    ]);

    render(<RoutesStub initialEntries={['/en']} />);

    expect(document.documentElement).toMatchSnapshot('expected html');
  });
});
