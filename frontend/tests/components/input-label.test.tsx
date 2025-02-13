import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputLabel } from '~/components/input-label';

describe('InputLabel', () => {
  it('should render input label component', () => {
    const { container } = render(
      <InputLabel id="id" data-testid="input-label">
        input test
      </InputLabel>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input label component with required', () => {
    const { container } = render(
      <InputLabel id="id" data-testid="input-label" required>
        input test
      </InputLabel>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
