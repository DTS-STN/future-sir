import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnchorLink } from '~/components/anchor-link';

describe('AnchorLink', () => {
  it('should render anchor link component', () => {
    const { container } = render(<AnchorLink anchorElementId="id">input test</AnchorLink>);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
