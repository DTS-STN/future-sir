import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tailwind-utils';

export interface DescriptionListItemProps extends ComponentProps<'div'> {
  term: ReactNode;
}
export function DescriptionListItem({ className, children, term, ...rest }: DescriptionListItemProps) {
  return (
    <div className={cn('py-6 sm:grid sm:grid-cols-3 sm:gap-4', className)} {...rest}>
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-1 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

export interface DescriptionListProps extends ComponentProps<'dl'> {}
export function DescriptionList(props: DescriptionListProps) {
  return <dl {...props} />;
}
