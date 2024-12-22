import type { ComponentProps } from 'react';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tailwind-utils';

type InlineLinkProps = ComponentProps<typeof AppLink>;

export function InlineLink({ className, children, file, hash, params, search, to, ...props }: InlineLinkProps) {
  const baseClassName = cn('text-slate-700 underline hover:text-blue-700 focus:text-blue-700');

  if (file) {
    return (
      <AppLink className={cn(baseClassName, className)} file={file} hash={hash} params={params} search={search} {...props}>
        {children}
      </AppLink>
    );
  }

  return (
    <AppLink className={cn(baseClassName, className)} to={to} {...props}>
      {children}
    </AppLink>
  );
}
