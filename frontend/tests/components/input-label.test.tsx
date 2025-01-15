import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputLabel } from '~/components/input-label';

describe('InputLabel', () => {
  it('should render input label component', () => {
    const { container } = render(<InputLabel id="id">input test</InputLabel>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
