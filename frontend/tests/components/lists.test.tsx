import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OrderedList, UnorderedList } from '~/components/lists';

describe('OrderedList', () => {
  it('should render ordered list component', () => {
    const { container } = render(
      <OrderedList id="id">
        <li>First item</li>
        <li>Second item</li>
      </OrderedList>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render ordered list component with classes', () => {
    const { container } = render(
      <OrderedList id="id" className="text-gray-700">
        <li>First item</li>
        <li>Second item</li>
      </OrderedList>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});

describe('UnorderedList', () => {
  it('should render unordered list component', () => {
    const { container } = render(
      <UnorderedList id="id">
        <li>First item</li>
        <li>Second item</li>
      </UnorderedList>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render unordered list component with classes', () => {
    const { container } = render(
      <UnorderedList id="id" className="text-gray-700">
        <li>First item</li>
        <li>Second item</li>
      </UnorderedList>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
