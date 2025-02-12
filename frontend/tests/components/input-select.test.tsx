import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputSelect } from '~/components/input-select';

describe('InputSelect', () => {
  it('should render input select component', () => {
    const { container } = render(
      <InputSelect
        id="some-id"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
      />,
    );

    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input select component with help message', () => {
    const { container } = render(
      <InputSelect
        id="some-id"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        helpMessage="help message"
      />,
    );

    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input select component with required', () => {
    const { container } = render(
      <InputSelect
        id="some-id"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        required
      />,
    );

    expect(container).toMatchSnapshot('expected html');
  });

  it('should render input select component with error message', () => {
    const { container } = render(
      <InputSelect
        id="some-id"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        errorMessage="error message"
      />,
    );

    expect(container).toMatchSnapshot('expected html');
  });
});
