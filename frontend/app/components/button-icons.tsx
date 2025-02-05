import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { cn } from '~/utils/tailwind-utils';

export function ButtonStartIcon({ className, ...restProps }: FontAwesomeIconProps) {
  return <FontAwesomeIcon fixedWidth className={cn('me-1', className)} {...restProps} />;
}

export function ButtonEndIcon({ className, ...restProps }: FontAwesomeIconProps) {
  return <FontAwesomeIcon fixedWidth className={cn('ms-1', className)} {...restProps} />;
}
