import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InlineLink } from '~/components';

describe('InlineLink', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render an InlineLink with the correct styles', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <InlineLink file="routes/public/_index.tsx">This is a test</InlineLink>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
