import type { ComponentProps, JSX } from 'react';

import { formatAddress } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

type AddressProps = ComponentProps<'address'> & {
  address: Parameters<typeof formatAddress>[0];
  format?: Parameters<typeof formatAddress>[1];
};

export function Address({ address, format, className, ...rest }: AddressProps): JSX.Element {
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...rest}>
      {formatAddress(address, format)}
    </address>
  );
}
