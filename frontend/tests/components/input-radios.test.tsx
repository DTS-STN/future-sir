import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';

describe('InputRadios', () => {
  const options: InputRadiosProps['options'] = [
    { children: 'Option 1', value: 'option1' },
    { children: 'Option 2', value: 'option2' },
  ];

  it('renders component with legend and options', () => {
    const { container } = render(<InputRadios id="it" legend="Test Legend" name="it" options={options} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('displays error message', () => {
    const { container } = render(
      <InputRadios id="it" legend="Test Legend" name="it" options={options} errorMessage="Test Error Message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('displays helpMessagePrimary', () => {
    const { container } = render(
      <InputRadios id="it" legend="Test Legend" name="it" options={options} helpMessagePrimary="Primary help message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('displays helpMessageSecondary', () => {
    const { container } = render(
      <InputRadios id="it" legend="Test Legend" name="it" options={options} helpMessageSecondary="Secondary help message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
