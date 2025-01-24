import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ButtonEndIcon, ButtonStartIcon } from '~/components/button-icons';

// Mock FontAwesomeIcon to avoid rendering actual icons in tests
vi.mock('@fortawesome/react-fontawesome', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FontAwesomeIcon: ({ className, icon, ['aria-label']: ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel}>
      {JSON.stringify(icon)}
    </div>
  ),
}));

describe('ButtonStartIcon', () => {
  it('should render FontAwesomeIcon with the correct classes', () => {
    const { container } = render(<ButtonStartIcon icon="spinner" className="custom-class" />);
    const icon = container.querySelector('div');

    expect(icon).toMatchSnapshot('expected html');
  });

  it('should pass additional props to FontAwesomeIcon', () => {
    const { container } = render(<ButtonStartIcon icon="spinner" aria-label="start-icon" />);
    const icon = container.querySelector('div');

    expect(icon).toMatchSnapshot('expected html');
  });
});

describe('ButtonEndIcon', () => {
  it('should render FontAwesomeIcon with the correct classes', () => {
    const { container } = render(<ButtonEndIcon icon="spinner" className="custom-class" />);
    const icon = container.querySelector('div');

    expect(icon).toMatchSnapshot('expected html');
  });

  it('should pass additional props to FontAwesomeIcon', () => {
    const { container } = render(<ButtonEndIcon icon="spinner" aria-label="end-icon" />);
    const icon = container.querySelector('div');

    expect(icon).toMatchSnapshot('expected html');
  });
});
