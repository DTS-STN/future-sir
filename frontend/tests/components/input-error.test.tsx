import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputError } from '~/components/input-error';

describe('InputError', () => {
  it('should render input label component', () => {
    const { container } = render(<InputError id="id">input test</InputError>);
    expect(container).toMatchSnapshot('expected html');
  });
});
