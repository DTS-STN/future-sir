import type { ComponentProps } from 'react';

import { cn } from '~/utils/tailwind-utils';

export type PageTitleProps = Omit<ComponentProps<'h1'>, 'id' | 'property'> & {
  subTitle?: string;
};

export function PageTitle({ children, className, subTitle, ...props }: PageTitleProps) {
  return (
    <div className="mt-10 mb-8">
      {subTitle && <h2>{subTitle}</h2>}
      <h1
        id="wb-cont"
        tabIndex={-1}
        className={cn(
          'font-lato text-3xl font-bold focus-visible:ring-3',
          'after:mt-2 after:block after:h-1.5 after:w-18 after:bg-red-700',
          className,
        )}
        {...props}
      >
        {children}
      </h1>
    </div>
  );
}
