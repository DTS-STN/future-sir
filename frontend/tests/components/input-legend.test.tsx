import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputLegend } from '~/components/input-legend';

describe('InputLegend', () => {
  it('should render input legend component', () => {
    const { container } = render(<InputLegend id="id">input legend</InputLegend>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
