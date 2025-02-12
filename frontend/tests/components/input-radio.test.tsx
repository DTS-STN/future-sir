import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputRadio } from '~/components/input-radio';

describe('InputRadio', () => {
  it('renders radio button with label and appends content', () => {
    const labelText = 'Radio Label';
    const appendContent = <div data-testid="append-content">Appended Content</div>;
    const { container } = render(
      <InputRadio id="test-radio" name="test-radio" append={appendContent}>
        {labelText}
      </InputRadio>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('disables radio button when disabled prop is provided', () => {
    const { container } = render(
      <InputRadio id="test-radio" name="test-radio" disabled>
        Radio Label
      </InputRadio>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
