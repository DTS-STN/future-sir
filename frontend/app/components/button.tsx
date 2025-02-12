import type { ComponentProps } from 'react';

import { ButtonEndIcon, ButtonStartIcon } from '~/components/button-icons';
import { cn } from '~/utils/tailwind-utils';

type ButtonEndIconProps = ComponentProps<typeof ButtonEndIcon>;
type ButtonStartIconProps = ComponentProps<typeof ButtonStartIcon>;

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
  link: 'bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:bg-gray-100 focus:text-blue-700 border-0 underline',
} as const;

export interface ButtonProps extends ComponentProps<'button'> {
  endIcon?: ButtonEndIconProps['icon'];
  endIconProps?: OmitStrict<ButtonEndIconProps, 'icon'>;
  pill?: boolean;
  size?: keyof typeof sizes;
  startIcon?: ButtonStartIconProps['icon'];
  startIconProps?: OmitStrict<ButtonStartIconProps, 'icon'>;
  variant?: keyof typeof variants;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 */
export function Button({
  children,
  className,
  endIcon,
  endIconProps,
  pill,
  size = 'base',
  startIcon,
  startIconProps,
  variant = 'default',
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    'font-lato inline-flex items-center justify-center rounded border align-middle outline-offset-4',
    sizes[size],
    variants[variant],
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
    pill && 'rounded-full',
    className,
  );
  return (
    <button className={buttonClassName} {...props}>
      {startIcon && <ButtonStartIcon {...(startIconProps ?? {})} icon={startIcon} />}
      {children}
      {endIcon && <ButtonEndIcon {...(endIconProps ?? {})} icon={endIcon} />}
    </button>
  );
}
