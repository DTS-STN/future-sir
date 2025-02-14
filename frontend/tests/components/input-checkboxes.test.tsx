import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputCheckboxes } from '~/components/input-checkboxes';

describe('InputCheckboxes', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const options: InputCheckboxesProps['options'] = [
    { children: 'Option 1', value: 'option1' },
    { children: 'Option 2', value: 'option2' },
  ];

  it('should render component with legend and options', () => {
    const { getByText } = render(<InputCheckboxes id="test-id" legend="Test Legend" name="test" options={options} />);

    expect(getByText('Test Legend')).toMatchSnapshot('expected html');
    expect(getByText('Option 1')).toMatchSnapshot('expected html');
    expect(getByText('Option 2')).toMatchSnapshot('expected html');
  });

  it('should display error message', () => {
    const { getByText } = render(
      <InputCheckboxes id="test-id" legend="Test Legend" name="test" options={options} errorMessage="Test Error Message" />,
    );
    expect(getByText('Test Error Message')).toMatchSnapshot('expected html');
  });

  it('should display helpMessagePrimary', () => {
    const { getByText } = render(
      <InputCheckboxes
        id="test-id"
        legend="Test Legend"
        name="test"
        options={options}
        helpMessagePrimary="Primary help message"
      />,
    );
    expect(getByText('Primary help message')).toMatchSnapshot('expected html');
  });

  it('should display helpMessageSecondary', () => {
    const { getByText } = render(
      <InputCheckboxes
        id="test-id"
        legend="Test Legend"
        name="test"
        options={options}
        helpMessageSecondary="Secondary help message"
      />,
    );
    expect(getByText('Secondary help message')).toMatchSnapshot('expected html');
  });
});
