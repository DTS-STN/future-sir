import type { PropsWithChildren, ReactNode } from 'react';

export interface DescriptionListItemProps extends PropsWithChildren {
  term: ReactNode;
}

export function DescriptionListItem({ children, term }: DescriptionListItemProps) {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:py-4">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}
