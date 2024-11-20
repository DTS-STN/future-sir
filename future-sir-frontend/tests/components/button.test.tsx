import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '~/components/button';

describe('Button', () => {
  it('should render a button with default styles', () => {
    const { container } = render(<Button>Test Button</Button>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should apply the correct styles for different sizes', () => {
    const { container } = render(<Button size="sm">Test Button</Button>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should apply the correct styles for different variants', () => {
    const { container } = render(<Button variant="primary">Test Button</Button>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a pill Button correctly', () => {
    const { container } = render(<Button pill={true}>Test Button</Button>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a disabled Button correctly', () => {
    const { container } = render(
      <Button disabled={true} pill={true}>
        Test Button
      </Button>,
    );
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
