import type { ComponentProps } from 'react';

import { cn } from '~/utils/tailwind-utils';

export type PageTitleProps = Omit<ComponentProps<'h1'>, 'id' | 'property'>;

export function PageTitle({ children, className, ...props }: PageTitleProps) {
  return (
    <h1
      id="wb-cont"
      tabIndex={-1}
      className={cn('font-lato mt-10 text-3xl font-bold focus-visible:ring-3', className)}
      {...props}
    >
      {children}
    </h1>
  );
}
