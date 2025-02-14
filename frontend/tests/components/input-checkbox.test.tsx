import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputCheckbox } from '~/components/input-checkbox';

describe('InputCheckbox', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should render checkbox with label and appends content', () => {
    const labelText = 'Checkbox Label';
    const appendContent = <div data-testid="append-content">Appended Content</div>;
    const { getByLabelText, getByTestId } = render(
      <InputCheckbox id="test-id" name="test-checkbox" append={appendContent}>
        {labelText}
      </InputCheckbox>,
    );

    // Check if checkbox and label are rendered correctly
    const checkbox = getByTestId('input-checkbox');
    const label = getByLabelText(labelText);
    expect(checkbox).toMatchSnapshot('expected html');
    expect(label).toMatchSnapshot('expected html');

    // Check if appended content is rendered
    const appendedContent = getByTestId('append-content');
    expect(appendedContent).toMatchSnapshot('expected html');
  });

  it('should fire onChange event when checkbox is clicked', () => {
    const onChangeMock = vi.fn();
    const { getByTestId } = render(
      <InputCheckbox id="test-id" name="test-checkbox" onChange={onChangeMock}>
        Checkbox Label
      </InputCheckbox>,
    );

    const checkbox = getByTestId('input-checkbox');
    fireEvent.click(checkbox);
    expect(onChangeMock).toHaveBeenCalledOnce();
  });

  it('should disable checkbox when disabled prop is provided', () => {
    const { getByTestId } = render(
      <InputCheckbox id="test-id" name="test-checkbox" disabled>
        Checkbox Label
      </InputCheckbox>,
    );

    const checkbox = getByTestId('input-checkbox');
    expect(checkbox).toMatchSnapshot('expected html');
  });

  it('should render input checkbox with error message', () => {
    const { container } = render(
      <InputCheckbox id="test-id" name="test" errorMessage="error message">
        input checkbox
      </InputCheckbox>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
