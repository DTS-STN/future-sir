import type { ComponentProps } from 'react';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tailwind-utils';

const sizes = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
} as const;

// prettier-ignore
const variants = {
  alternative: 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:bg-gray-100 focus:text-blue-700',
  default: 'border-gray-300 bg-gray-200 text-slate-700 hover:bg-neutral-300 focus:bg-neutral-300',
  dark: 'border-gray-800 bg-gray-800 text-white hover:bg-gray-900 focus:bg-gray-900',
  green: 'border-green-700 bg-green-700 text-white hover:bg-green-800 focus:bg-green-800',
  primary: 'border-slate-700 bg-slate-700 text-white hover:bg-sky-800 focus:bg-sky-800',
  red: 'border-red-700 bg-red-700 text-white hover:bg-red-800 focus:bg-red-800',
} as const;

type ButtonLinkStyleProps = {
  className?: string;
  pill?: boolean;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
};

type ButtonLinkProps = ComponentProps<typeof AppLink> &
  ButtonLinkStyleProps & {
    disabled?: boolean;
  };

export function ButtonLink({
  children,
  className,
  disabled,
  file,
  hash,
  params,
  pill,
  search,
  to,
  size = 'base',
  variant = 'default',
  ...props
}: ButtonLinkProps) {
  const baseClassName = cn(
    'inline-flex items-center justify-center rounded-sm border align-middle font-lato no-underline outline-offset-4',
    sizes[size],
    variants[variant],
    pill && 'rounded-full',
  );

  if (disabled) {
    return (
      <a
        className={cn(baseClassName, 'pointer-events-none cursor-not-allowed opacity-70', className)}
        role="link"
        aria-disabled="true"
        {...props}
      >
        {children}
      </a>
    );
  }

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
