import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '~/components/button';

describe('Button', () => {
  it('should render a button with default styles', () => {
    const { container } = render(<Button>Test Button</Button>);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should apply the correct styles for different sizes', () => {
    const { container } = render(<Button size="sm">Test Button</Button>);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should apply the correct styles for different variants', () => {
    const { container } = render(<Button variant="primary">Test Button</Button>);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a pill Button correctly', () => {
    const { container } = render(<Button pill={true}>Test Button</Button>);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a disabled Button correctly', () => {
    const { container } = render(
      <Button disabled={true} pill={true}>
        Test Button
      </Button>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should execute the onClick handler', () => {
    const handleClick = vi.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click me</Button>);
    const button = getByText('Click me');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
