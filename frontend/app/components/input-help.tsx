import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tailwind-utils';

export interface InputHelpProps extends ComponentProps<'span'> {
  children: ReactNode;
  id: string;
}

export function InputHelp(props: InputHelpProps) {
  const { children, className, ...restProps } = props;
  return (
    <span className={cn('block max-w-prose text-gray-500', className)} data-testid="input-help" {...restProps}>
      {children}
    </span>
  );
}
