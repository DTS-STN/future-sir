import type { ComponentProps, JSX } from 'react';

import { cn } from '~/utils/tailwind-utils';

/**
 * OrderedList Component
 *
 * A styled `<ol>` component that applies a decimal list style, spacing, and padding.
 *
 * @returns - A styled ordered list component.
 */
export function OrderedList({ className, children, ...props }: ComponentProps<'ol'>): JSX.Element {
  return <ol className={cn('list-decimal space-y-1 pl-7', className)}>{children}</ol>;
}

/**
 * UnorderedList Component
 *
 * A styled `<ul>` component that applies a disc list style, spacing, and padding.
 *
 * @returns - A styled unordered list component.
 */
export function UnorderedList({ className, children, ...props }: ComponentProps<'ol'>): JSX.Element {
  return <ul className={cn('list-disc space-y-1 pl-7', className)}>{children}</ul>;
}
