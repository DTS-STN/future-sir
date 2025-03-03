import type { ComponentProps } from 'react';

import { formatAddress } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

export interface AddressDetails {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  postalZipCode?: string;
  provinceState?: string;
}

export interface AddressProps extends ComponentProps<'address'> {
  address: AddressDetails;
  /**
   * The format of the address
   *
   * - `standard`: The standard address format, with the address line, city, province/state, postal/zip code, and country.
   * - `alternative`: An alternative address format, with the address line, city, province/state, postal/zip code, and country on separate lines.
   */
  format?: 'standard' | 'alternative';
}

export function Address({ address, format = 'standard', className, ...restProps }: AddressProps) {
  const formattedAddress = formatAddress({ ...address, format });
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
