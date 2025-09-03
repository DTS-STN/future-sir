import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Address } from '~/components/address';

describe('formatAddress', () => {
  it('should format a standard address with all fields', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: 'Apt 4B',
          addressLine2: '123 Main St',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format a standard address without addressLine2', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '123 Main St',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format a standard address with all fields, simple addressLine2', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '123 Main St',
          addressLine2: '4B',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format a standard address without provinceState and postalZipCode', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '789 Pine Ln',
          city: 'London',
          country: 'UK',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format an alternative address with all fields', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
        format="alternative"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format an alternative address without provinceState and postalZipCode', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '789 Pine Ln',
          city: 'London',
          country: 'UK',
        }}
        format="alternative"
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should handle empty addressLine1 and addressLine2', () => {
    const { container } = render(
      <Address
        address={{
          city: 'London',
          country: 'UK',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should handle empty addressLine1, addressLine2, and city', () => {
    const { container } = render(
      <Address
        address={{
          country: 'UK',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should handle empty provinceState', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '123 Main St',
          city: 'Anytown',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should format a standard address with complex suite name', () => {
    const { container } = render(
      <Address
        address={{
          addressLine1: '123 Main St',
          addressLine2: 'Suite 4B',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        }}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
