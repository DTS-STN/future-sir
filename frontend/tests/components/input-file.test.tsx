import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputFile } from '~/components/input-file';

describe('InputFile', () => {
  it('should render input file component', () => {
    const { container } = render(<InputFile id="test-id" name="test" label="label test" accept="" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input file with help message', () => {
    const { container } = render(
      <InputFile id="test-id" name="test" label="label test" helpMessageSecondary="help message" accept="" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input file with required', () => {
    const { container } = render(<InputFile id="test-id" name="test" label="label test" required accept="" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input file with error message', () => {
    const { container } = render(
      <InputFile id="test-id" name="test" label="label test" errorMessage="error message" accept="" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
