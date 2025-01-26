import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnchorLink } from '~/components/anchor-link';

describe('AnchorLink', () => {
  it('should render anchor link component', () => {
    const { container } = render(
      <>
        <AnchorLink anchorElementId="id" onClick={vi.fn()}>
          click here
        </AnchorLink>
        <div id="id">Some content.</div>
      </>,
    );

    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should scroll to the correct element', () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.focus = vi.fn();

    const { container, getByTestId } = render(
      <>
        <AnchorLink anchorElementId="id" onClick={vi.fn()}>
          click here
        </AnchorLink>
        <div id="id">Some content.</div>
      </>,
    );

    fireEvent.click(getByTestId('anchor-link'));

    expect(container.innerHTML).toMatchSnapshot('expected html');
    expect(HTMLElement.prototype.focus).toHaveBeenCalled();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should handle click event without an onClick callback', () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.focus = vi.fn();

    const { container, getByTestId } = render(
      <>
        <AnchorLink anchorElementId="id">click here</AnchorLink>
        <div id="id">Some content.</div>
      </>,
    );

    fireEvent.click(getByTestId('anchor-link'));

    expect(container.innerHTML).toMatchSnapshot('expected html');
    expect(HTMLElement.prototype.focus).toHaveBeenCalled();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
