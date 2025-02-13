import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputHelp } from '~/components/input-help';

describe('InputHelp', () => {
  it('should render input help component', () => {
    const { container } = render(<InputHelp id="id">input help</InputHelp>);
    expect(container).toMatchSnapshot('expected html');
  });
});
