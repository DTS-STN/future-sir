import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { Link } from 'react-router';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tailwind-utils';

type AppLinkProps = {
  file: ComponentProps<typeof AppLink>['file'];
  to?: never;
} & ComponentProps<typeof AppLink>;

type LinkProps = {
  to: ComponentProps<typeof Link>['to'];
  file?: never;
} & ComponentProps<typeof Link>;

type InlineLinkProps = AppLinkProps | LinkProps;

export const InlineLink = forwardRef<ElementRef<typeof AppLink> | ElementRef<typeof Link>, InlineLinkProps>(
  ({ className, children, ...props }, ref) => {
    const baseClassName = 'text-slate-700 underline hover:text-blue-700 focus:text-blue-700';

    if (props.file) {
      return (
        <AppLink ref={ref} className={cn(baseClassName, className)} {...props}>
          {children}
        </AppLink>
      );
    }

    return (
      <Link ref={ref} className={cn(baseClassName, className)} {...props}>
        {children}
      </Link>
    );
  },
);

InlineLink.displayName = 'InlineLink';
