import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  BilingualErrorBoundary,
  BilingualNotFound,
  UnilingualErrorBoundary,
  UnilingualNotFound,
} from '~/components/error-boundaries';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

describe('error-boundaries', () => {
  describe('BilingualErrorBoundary', () => {
    it('should correctly render the bilingual error boundary when it catches a generic error', () => {
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

    it('should correctly render the bilingual error boundary when it catches an AppError', () => {
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

  describe('BilingualNotFound', () => {
    it('should correctly render the bilingual 404 when it catches a 404 error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => <BilingualNotFound params={{}} error={new Response('Not found', { status: 404 })} />,
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html');
    });
  });

  describe('UnilingualErrorBoundary', () => {
    it('should correctly render the unilingual error boundary when it catches a generic error', () => {
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

    it('should correctly render the unilingual error boundary when it catches an AppError', () => {
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

  describe('UnilingualNotFound', () => {
    it('should correctly render the unilingual 404 when it catches a 404 error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => <UnilingualNotFound params={{}} error={new Response('Not found', { status: 404 })} />,
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html');
    });
  });
});
