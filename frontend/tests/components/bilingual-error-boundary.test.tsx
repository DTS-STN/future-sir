import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BilingualErrorBoundary } from '~/components/bilingual-error-boundary';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

describe('BilingualErrorBoundary', () => {
  it('should render the bilingual error boundary when it catches a generic error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/',
        Component: () => <BilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
      },
    ]);

    render(<RoutesStub />);

    expect(document.documentElement).toMatchSnapshot('expected html');
  });

  it('should render the bilingual error boundary when it catches an AppError', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/',
        Component: () => (
          <BilingualErrorBoundary
            params={{}}
            error={new AppError('Something went wrong', ErrorCodes.UNCAUGHT_ERROR, { correlationId: 'XX-000000' })}
          />
        ),
      },
    ]);

    render(<RoutesStub />);

    expect(document.documentElement).toMatchSnapshot('expected html');
  });
});
