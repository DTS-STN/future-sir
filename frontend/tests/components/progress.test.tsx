import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress } from '~/components/progress';

describe('Progress component', () => {
  it('renders with default props', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <Progress label="test" value={0} />,
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/en/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders with custom size and variant', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <Progress size="lg" variant="blue" label="test" value={0} />,
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/en/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders with custom value', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <Progress value={50} label="test" />,
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/en/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders with custom className', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/en/public',
        Component: () => <Progress className="custom-class" label="test" value={0} />,
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/en/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
