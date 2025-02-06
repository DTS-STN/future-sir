import type { HTMLProps, JSX } from 'react';

import type { FlipProp, IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '~/utils/tailwind-utils';

type CardProps = HTMLProps<HTMLDivElement> & {
  /**
   * Use the asChild prop to change the default rendered element for the one passed
   * as a child, merging their props and behavior. Useful for rendering links.
   */
  asChild?: boolean;
};

/**
 * Card component renders a card with optional child rendering.
 * It supports various customization options.
 */
export function Card({ className, asChild, ...props }: CardProps): JSX.Element {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      className={cn(
        'group block rounded-xs border bg-white shadow-xs [&:is(a)]:hover:bg-gray-50 [&:is(a)]:hover:shadow-md',
        className,
      )}
      {...props}
    />
  );
}

/**
 * CardHeader component renders the header section of a card.
 */
export function CardHeader({ className, ...props }: HTMLProps<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

type CardTitleProps = HTMLProps<HTMLHeadingElement> & {
  /**
   * Use the asChild prop to change the default rendered element for the one passed as a child, merging their props and behavior.
   */
  asChild?: boolean;
};

/**
 * CardTitle component renders the title of a card.
 * It supports optional child rendering.
 */
export function CardTitle({ asChild, className, ...props }: CardTitleProps) {
  const Comp = asChild ? Slot : 'h3';
  return (
    <Comp
      className={cn(
        'leading-none font-semibold group-[&:is(a)]:text-slate-700 group-[&:is(a)]:underline group-[&:is(a):focus]:text-blue-700 group-[&:is(a):hover]:text-blue-700',
        className,
      )}
      {...props}
    />
  );
}

/**
 * CardDescription component renders the description of a card.
 */
export function CardDescription({ className, ...props }: HTMLProps<HTMLDivElement>) {
  return <div className={cn('text-sm text-black/60', className)} {...props} />;
}

/**
 * CardContent component renders the content section of a card.
 */
export function CardContent({ className, ...props }: HTMLProps<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

/**
 * CardFooter component renders the footer section of a card.
 */
export function CardFooter({ className, ...props }: HTMLProps<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

/**
 * CardImage component renders an image in a card.
 */
export function CardImage({ className, ...props }: HTMLProps<HTMLImageElement>) {
  return (
    <img
      alt=""
      className={cn('relative aspect-video h-40 w-full object-cover sm:h-48', className)}
      loading="lazy"
      draggable="false"
      {...props}
    />
  );
}

/**
 * CardTag component renders a tag in a card.
 */
export function CardTag({ className, ...props }: HTMLProps<HTMLSpanElement>) {
  return <span className={cn('inline-block bg-cyan-700 px-2 py-1 text-xs text-white', className)} {...props} />;
}

type CardIconProps = OmitStrict<HTMLProps<HTMLDivElement>, 'children'> & {
  /**
   * FontAwesome icon to be displayed.
   */
  icon: IconProp;
  /**
   * Additional class names for styling the icon.
   */
  iconClassName?: IconProp;
  /**
   * Flip property for the icon.
   */
  iconFlip?: FlipProp;
};

/**
 * CardIcon component renders an icon in a card.
 */
export function CardIcon({ className, icon, iconClassName, iconFlip, ...props }: CardIconProps) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-700 sm:size-12" {...props}>
      <FontAwesomeIcon icon={icon} flip={iconFlip} className={cn('size-4 text-white sm:size-5', iconClassName)} />
    </div>
  );
}
