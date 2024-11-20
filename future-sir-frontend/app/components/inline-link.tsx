import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { AppLink } from '~/components';
import { cn } from '~/utils';

type InlineLinkProps = ComponentProps<typeof AppLink>;

export const InlineLink = forwardRef<ElementRef<typeof AppLink>, InlineLinkProps>(({ className, children, ...props }, ref) => {
  return (
    <AppLink className={cn('text-slate-700 underline hover:text-blue-700 focus:text-blue-700', className)} {...props}>
      {children}
    </AppLink>
  );
});

InlineLink.displayName = 'InlineLink';
