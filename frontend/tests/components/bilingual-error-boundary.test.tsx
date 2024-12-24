import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BilingualErrorBoundary } from '~/components/bilingual-error-boundary';

describe('BilingualErrorBoundary', () => {
  it('should render the bilingual error boundary', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <BilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
      },
    ]);

    render(<RoutesStub initialEntries={['/en/public']} />);
    expect(document.documentElement.outerHTML).toMatchSnapshot('expected html');
  });
});
