import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InputPhoneField } from '~/components/input-phone-field';

describe('InputPhoneField', () => {
  it('should render', () => {
    const phoneNumber = '+15146667777';
    const { container } = render(<InputPhoneField id="test-id" name="test" label="label test" defaultValue={phoneNumber} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render international phone number', () => {
    const phoneNumber = '+50644444444';
    const { container } = render(<InputPhoneField id="test-id" name="test" label="label test" defaultValue={phoneNumber} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with help message', () => {
    const phoneNumber = '+15146667777';
    const { container } = render(
      <InputPhoneField
        id="test-id"
        name="test"
        label="label test"
        defaultValue={phoneNumber}
        helpMessageSecondary="help message"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with required', () => {
    const phoneNumber = '+15146667777';
    const { container } = render(
      <InputPhoneField id="test-id" name="test" label="label test" defaultValue={phoneNumber} required />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render with error message', () => {
    const phoneNumber = '+15146667777';
    const { container } = render(
      <InputPhoneField id="test-id" name="test" label="label test" defaultValue={phoneNumber} errorMessage="error message" />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
