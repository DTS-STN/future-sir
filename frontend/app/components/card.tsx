import type { ComponentProps, HTMLElementType, ReactElement } from 'react';

import type { To } from 'react-router';

import type { FlipProp, IconProp } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { AppLink } from '~/components/links';
import type { I18nRouteFile } from '~/i18n-routes';
import { cn } from '~/utils/tailwind-utils';

type CardBaseProps = Omit<ComponentProps<typeof AppLink>, 'to' | 'file' | 'title'> & {
  to?: To;
  file?: I18nRouteFile;
};

type CardProps = CardBaseProps & {
  /**
   * Optional image to be displayed at the top of the card.
   */
  image?: ReactElement<typeof CardImage>;

  /**
   * Optional tag to be displayed at the top-left corner of the card.
   */
  tag?: ReactElement<typeof CardTag>;
};

/**
 * Card component renders a card with an optional image, icon, tag.
 * It supports various customization options and can be used for navigation or clicking
 */
export function Card({ children, className, image, tag, ...props }: CardProps) {
  const { disabled, to, file, onClick } = props;
  const isLink = to || file ? true : false;
  const isButton = onClick ? true : false;
  const isClickable = isLink || isButton;
  const baseClassName = `rounded-sm ${isClickable ? 'select-none' : ''} ${disabled ? 'bg-white' : 'bg-blue-900'}`;

  return (
    <div className={cn(baseClassName, className)}>
      <CardBase isLink={isLink} isButton={isButton} {...props}>
        {image}
        <div className="relative p-8">
          {tag}
          <div className="flex items-center gap-4">{children}</div>
        </div>
      </CardBase>
    </div>
  );
}

/**
 * Provides the base element for the Card component
 * Renders an AppLink if the 'To' or 'File' prop is specified.
 * Renders an Anchor tag if the 'onClick' prop is provided.
 * Defaults to rendering a Span tag if neither prop is given.
 */
function CardBase({
  disabled,
  isLink,
  isButton,
  ...props
}: CardBaseProps & {
  isLink?: boolean;
  isButton?: boolean;
}) {
  const baseClassName = cn(
    'group block overflow-hidden rounded-sm border border-gray-500 bg-white shadow-xs outline-offset-4',
    'aria-disabled:pointer-events-none aria-disabled:bg-gray-200 aria-disabled:opacity-70 aria-disabled:shadow-none',
  );
  const interactableClassName =
    'transition-opacity duration-200 ease-in-out hover:bg-gray-50 hover:shadow-md focus:bg-gray-50 active:opacity-90';

  return isLink ? (
    <AppLink
      className={cn(baseClassName, interactableClassName)}
      disabled={disabled}
      {...(props as ComponentProps<typeof AppLink>)}
    >
      {props.children}
    </AppLink>
  ) : isButton ? (
    <a role="button" className={cn(baseClassName, interactableClassName)} aria-disabled={disabled} tabIndex={0} {...props}>
      {props.children}
    </a>
  ) : (
    <span className={baseClassName} aria-disabled={disabled} {...props}>
      {props.children}
    </span>
  );
}

type CardImageProps = {
  /**
   * Optional image URL to be displayed at the top of the card.
   */
  src: string;

  /**
   * Alternative text for the image.
   */
  alt: string;
};

export function CardImage({ src, alt }: CardImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="relative aspect-video h-40 w-full object-cover sm:h-48"
      loading="lazy"
      draggable="false"
    />
  );
}

type CardTagProps = {
  /**
   * Optional tag text to be displayed at the top-left corner of the card.
   */
  tag: string;
};

export function CardTag({ tag }: CardTagProps) {
  return <span className="absolute top-0 left-0 block bg-cyan-700 px-2 py-1 text-xs text-white">{tag}</span>;
}

type CardIconProps = {
  /**
   * Optional FontAwesome icon to be displayed.
   */
  icon: IconProp;

  /**
   * The flip property for the icon.
   */
  iconFlip?: FlipProp;

  /**
   * Children property, used for the card content
   */
  children?: React.ReactNode;
};

export function CardIcon({ icon, iconFlip, children }: CardIconProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-700">
        <FontAwesomeIcon icon={icon} flip={iconFlip} className="size-5 text-white" />
      </div>
      {children}
    </div>
  );
}

type CardTitleProps = {
  /**
   * The title text to be displayed.
   */
  title: string;

  /**
   *  The HTML element to be used for the title
   *  @default 'h3'
   */
  titleAs?: ExtractStrict<HTMLElementType, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'>;

  /**
   * Determines if it highlights like a link.
   */
  highlight?: boolean;

  /**
   * Children property, used for the card content
   */
  children?: React.ReactNode;
};

export function CardTitle({ titleAs: TitleComponent = 'h3', title, highlight, children }: CardTitleProps) {
  const baseClassName = `text-lg font-bold text-slate-700 ${highlight ? 'underline group-hover:text-blue-700 group-focus:text-blue-700' : ''}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TitleComponent className={baseClassName}>{title}</TitleComponent>
        {highlight && <FontAwesomeIcon aria-hidden icon={faChevronRight} className={cn('mt-1', baseClassName)} />}
      </div>
      <div>{children}</div>
    </div>
  );
}
