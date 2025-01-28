import { createRoutesStub, useRouteError } from 'react-router';

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLink, InlineLink } from '~/components/links';
import type { AppError } from '~/errors/app-error';

describe('links', () => {
  beforeEach(() => {
    // suppress any errors that are logged by the 'should throw' tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('AppLink', () => {
    it('should render a link with a specified language when provided', () => {
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

    it('should render a link with the current language if no specific language is provided', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/fr/public',
          Component: () => <AppLink file="routes/public/index.tsx">This is a test</AppLink>,
        },
      ]);

      const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

      expect(container.innerHTML).toMatchSnapshot('expected html');
    });

    it('should throw an error if no language is available', () => {
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

    it('should render a disabled link', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/en/public',
          Component: () => (
            <AppLink disabled file="routes/public/index.tsx">
              This is a test
            </AppLink>
          ),
        },
      ]);

      const { container } = render(<RoutesStub initialEntries={['/en/public']} />);

      expect(container.innerHTML).toMatchSnapshot('expected html');
    });
  });

  describe('InlineLink', () => {
    it('should correctly render an InlineLink when the file property is provided', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/fr/public',
          Component: () => <InlineLink file="routes/public/index.tsx">This is a test</InlineLink>,
        },
      ]);

      const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

      expect(container.innerHTML).toMatchSnapshot('expected html');
    });

    it('should correctly render an InlineLink when the to property is provided', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/fr/public',
          Component: () => <InlineLink to="https://example.com/">This is a test</InlineLink>,
        },
      ]);

      const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

      expect(container.innerHTML).toMatchSnapshot('expected html');
    });
  });
});
