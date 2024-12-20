import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UnilingualErrorBoundary } from '~/components/canada.ca/unilingual-error-boundary';

vi.mock('react-i18next');

describe('UnilingualErrorBoundary', () => {
  it('should render the unilingual error boundary', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <UnilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
      },
    ]);

    render(<RoutesStub initialEntries={['/en/public']} />);
    expect(document.documentElement.outerHTML).toMatchSnapshot('expected html');
  });
});
