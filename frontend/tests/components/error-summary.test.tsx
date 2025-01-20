import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorSummary } from '~/components/error-summary';

describe('ErrorSummary', () => {
  it('should not render an error summary when errors are undefined', () => {
    const { container } = render(<ErrorSummary errors={undefined} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should not render an error summary when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={{ Test: [] }} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render an error summary with 1 error', () => {
    const { container } = render(<ErrorSummary errors={{ Test: ['Test error 1'] }} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render an error summary with 2 errors', () => {
    const { container } = render(<ErrorSummary full errors={{ Test: ['Test error 1', 'Test error 2'] }} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
