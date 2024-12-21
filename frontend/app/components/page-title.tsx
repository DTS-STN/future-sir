import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import { cn } from '~/utils/tailwind-utils';

type PageTitleProps = Omit<ComponentProps<'h1'>, 'id' | 'property'>;

export const PageTitle = forwardRef<HTMLHeadingElement, PageTitleProps>(({ children, className, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      id="wb-cont"
      tabIndex={-1}
      className={cn('mt-10 font-lato text-3xl font-bold focus-visible:ring', className)}
      {...props}
    >
      {children}
    </h1>
  );
});

PageTitle.displayName = 'PageTitle';
