import type { ComponentProps, JSX } from 'react';

import { trimToUndefined } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

/**
 * Formats an apartment/suite number with the address
 */
function formatAddressLine(addressLine1: string | undefined, addressLine2: string | undefined): string | undefined {
  if (!addressLine1?.trim()) return addressLine2;
  if (!addressLine2?.trim()) return addressLine1;

  // check if addressLine2 is a simple alphanumeric suite number
  const isSuiteNumber = /^\w+$/i.test(addressLine2.trim());

  return isSuiteNumber
    ? `${addressLine2.trim()}-${addressLine1.trim()}` // ex: Apt 4B-123 Main St
    : `${addressLine1.trim()} ${addressLine2.trim()}`; // ex: 123 Main St Apt 4B
}

type AddressProps = ComponentProps<'address'> & {
  /**
   * The address to be formatted
   */
  address: {
    /**
     * Street name and house number
     */
    addressLine1?: string;
    /**
     * Apartment, suite, or unit number
     */
    addressLine2?: string;
    /**
     * City name
     */
    city?: string;
    /**
     * Province or state code
     */
    provinceState?: string;
    /**
     * Postal or ZIP code (optional)
     */
    postalZipCode?: string;
    /**
     * Country name
     */
    country: string;
  };
  /**
   * The format to use, where:
   * - `standard`: The standard address format, with the address line, city, province/state, postal/zip code, and country.
   * - `alternative`: An alternative address format, with the address line, city, province/state, postal/zip code, and country on separate lines.
   */
  format?: 'standard' | 'alternative';
};

export function Address({ address, format, className, ...rest }: AddressProps): JSX.Element {
  const addressLine1 = trimToUndefined(address.addressLine1);
  const addressLine2 = trimToUndefined(address.addressLine2);
  const city = trimToUndefined(address.city);
  const provinceState = trimToUndefined(address.provinceState);
  const postalZipCode = trimToUndefined(address.postalZipCode);
  const country = trimToUndefined(address.country);
  const lines = (
    format === 'alternative'
      ? [
          formatAddressLine(addressLine1, addressLine2),
          [city, provinceState].filter(Boolean).join(', '),
          postalZipCode,
          country,
        ]
      : [
          formatAddressLine(addressLine1, addressLine2),
          // note the intentional extra space added before postal code
          // see https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/important-information.page
          [city, provinceState, postalZipCode && ` ${postalZipCode}`].filter(Boolean).join(' '),
          country,
        ]
  )
    .map((line) => line?.trim())
    .filter(Boolean)
    .join('\n');

  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...rest}>
      {lines}
    </address>
  );
}
