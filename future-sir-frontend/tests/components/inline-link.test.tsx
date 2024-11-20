import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InlineLink } from '~/components/inline-link';

describe('InlineLink', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

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
