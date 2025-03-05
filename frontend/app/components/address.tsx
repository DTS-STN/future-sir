import type { ComponentProps, JSX } from 'react';

import { formatAddress } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

type Address = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalZipCode?: string;
  provinceState?: string;
  country: string;
};

type AddressProps = ComponentProps<'address'> & {
  address: Address;
  /**
   * The format of the address
   *
   * - `standard`: The standard address format, with the address line, city, province/state, postal/zip code, and country.
   * - `alternative`: An alternative address format, with the address line, city, province/state, postal/zip code, and country on separate lines.
   */
  format?: 'standard' | 'alternative';
};

export function Address({ address, format, className, ...rest }: AddressProps): JSX.Element {
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...rest}>
      {formatAddress(address, format)}
    </address>
  );
}
