import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputPatternField } from '~/components/input-pattern-field';

describe('InputPatternField', () => {
  const testFormat = '### ### ###';

  it.each([
    ['800000002', '800 000 002'],
    ['800 000 002', '800 000 002'],
    ['800-000-002', '800 000 002'],
    ['800 000-002', '800 000 002'],
    ['800000 002', '800 000 002'],
    ['800000-002', '800 000 002'],
  ])('should render %s -> %s', (defaultValue, expected) => {
    const { container } = render(
      <InputPatternField id="test-id" name="test" label="label test" defaultValue={defaultValue} format={testFormat} />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with help message', () => {
    const { container } = render(
      <InputPatternField
        id="test-id"
        name="test"
        label="label test"
        format={testFormat}
        defaultValue="800000002"
        helpMessageSecondary="help message"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with required', () => {
    const { container } = render(
      <InputPatternField id="test-id" name="test" label="label test" format={testFormat} defaultValue="800000002" required />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with error message', () => {
    const { container } = render(
      <InputPatternField
        id="test-id"
        name="test"
        label="label test"
        format={testFormat}
        defaultValue="800000002"
        errorMessage="error message"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
