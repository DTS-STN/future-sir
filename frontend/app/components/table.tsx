import type { ComponentProps, JSX } from 'react';

import { cn } from '~/utils/tailwind-utils';

export function Table({ className, ref, ...props }: ComponentProps<'table'>): JSX.Element {
  return (
    <div className="relative w-full overflow-x-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-left text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ref, ...props }: ComponentProps<'thead'>): JSX.Element {
  return <thead ref={ref} className={cn('[&_tr]:border-b-2', className)} {...props} />;
}

export function TableBody({ className, ref, ...props }: ComponentProps<'tbody'>): JSX.Element {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableFooter({ className, ref, ...props }: ComponentProps<'tfoot'>): JSX.Element {
  return (
    <tfoot ref={ref} className={cn('border-t bg-neutral-100/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
  );
}

export function TableRow({ className, ref, ...props }: ComponentProps<'tr'>): JSX.Element {
  return (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100', className)}
      {...props}
    />
  );
}

export function TableHead({ className, ref, ...props }: ComponentProps<'th'>): JSX.Element {
  return (
    <th
      ref={ref}
      className={cn(
        'h-10 p-3 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ref, ...props }: ComponentProps<'td'>): JSX.Element {
  return (
    <td
      ref={ref}
      className={cn('px-3 py-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]', className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ref, ...props }: ComponentProps<'caption'>): JSX.Element {
  return <caption ref={ref} className={cn('mt-4 text-sm text-current/80', className)} {...props} />;
}
