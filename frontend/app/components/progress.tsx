import type React from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { useLanguage } from '~/hooks/use-language';
import { formatPercent } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

const sizes = {
  sx: 'h-1',
  sm: 'h-1.5',
  base: 'h-2.5',
  lg: 'h-4',
  xl: 'h-6',
};

const variants = {
  blue: 'bg-blue-600',
  default: 'bg-gray-600',
  green: 'bg-green-600',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
};

const rootBaseClassName = 'relative w-full overflow-hidden rounded-full bg-gray-200';
const indicatorBaseClassName = 'h-full w-full flex-1 transition-all';

export interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  className?: string;
  id?: string;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  label: string;
  value: number;
}

export function Progress({
  className,
  id = 'progress-label',
  size = 'base',
  variant = 'default',
  value,
  label,
  ...props
}: ProgressProps) {
  const { currentLanguage } = useLanguage();

  return (
    <>
      {label && currentLanguage && <p id={id} className="mb-2">{`${label} ${formatPercent(value, currentLanguage)}`}</p>}
      <ProgressPrimitive.Root
        className={cn(rootBaseClassName, sizes[size], className)}
        data-testid="progress-root"
        value={value}
        {...props}
        aria-labelledby={label && id}
      >
        <ProgressPrimitive.Indicator
          className={cn(indicatorBaseClassName, variants[variant])}
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
    </>
  );
}
