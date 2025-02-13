import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputTextarea } from '~/components/input-textarea';

describe('InputTextarea', () => {
  it('should render', () => {
    const { container } = render(<InputTextarea id="test-id" name="test" label="label test" defaultValue="default value" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with help message', () => {
    const { container } = render(
      <InputTextarea id="test-id" name="test" label="label test" defaultValue="default value" helpMessage="help message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with required', () => {
    const { container } = render(
      <InputTextarea id="test-id" name="test" label="label test" defaultValue="default value" required />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with error message', () => {
    const { container } = render(
      <InputTextarea id="test-id" name="test" label="label test" defaultValue="default value" errorMessage="error message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
