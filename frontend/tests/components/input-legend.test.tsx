import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputLegend } from '~/components/input-legend';

describe('InputLegend', () => {
  it('should render input legend component', () => {
    const { container } = render(
      <InputLegend id="id" data-testid="input-legend">
        input legend
      </InputLegend>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input legend component with required', () => {
    const { container } = render(
      <InputLegend id="id" data-testid="input-legend" required>
        input legend
      </InputLegend>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
