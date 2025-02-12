import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputField } from '~/components/input-field';

describe('InputField', () => {
  it('should render input field component', () => {
    const { container } = render(<InputField id="test-id" name="test" label="label test" defaultValue="default value" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input field with help message', () => {
    const { container } = render(
      <InputField
        id="test-id"
        name="test"
        label="label test"
        defaultValue="default value"
        helpMessageSecondary="help message"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input field with required', () => {
    const { container } = render(
      <InputField id="test-id" name="test" label="label test" defaultValue="default value" required />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input field with error message', () => {
    const { container } = render(
      <InputField id="test-id" name="test" label="label test" defaultValue="default value" errorMessage="error message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
