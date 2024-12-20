import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tailwind-utils';

const sizes = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
} as const;

const variants = {
  alternative:
    'border-gray-200 bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:bg-gray-100 focus:text-blue-700',
  default: 'border-gray-300 bg-gray-200 text-slate-700 hover:bg-neutral-300 focus:bg-neutral-300',
  dark: 'border-gray-800 bg-gray-800 text-white hover:bg-gray-900 focus:bg-gray-900',
  green: 'border-green-700 bg-green-700 text-white hover:bg-green-800 focus:bg-green-800',
  primary: 'border-slate-700 bg-slate-700 text-white hover:bg-sky-800 focus:bg-sky-800',
  red: 'border-red-700 bg-red-700 text-white hover:bg-red-800 focus:bg-red-800',
} as const;

type ButtonLinkProps = ComponentProps<typeof AppLink> & {
  disabled?: boolean;
  pill?: boolean;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
};

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 *
 * Disabling a link
 * @see https://www.scottohara.me/blog/2021/05/28/disabled-links.html
 */
export const ButtonLink = forwardRef<HTMLAnchorElement | ElementRef<typeof AppLink>, ButtonLinkProps>(
  ({ children, className, disabled, file, pill, size = 'base', variant = 'default', ...props }, ref) => {
    if (disabled) {
      return (
        <a
          ref={ref}
          className={cn(
            cn(
              'inline-flex items-center justify-center rounded border align-middle font-lato no-underline outline-offset-4',
              sizes[size],
              variants[variant],
              pill && 'rounded-full',
              className,
            ),
            'pointer-events-none cursor-not-allowed opacity-70',
          )}
          role="link"
          aria-disabled="true"
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <AppLink
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded border align-middle font-lato no-underline outline-offset-4',
          sizes[size],
          variants[variant],
          pill && 'rounded-full',
          className,
        )}
        file={file}
        {...props}
      >
        {children}
      </AppLink>
    );
  },
);

ButtonLink.displayName = 'ButtonLink';
