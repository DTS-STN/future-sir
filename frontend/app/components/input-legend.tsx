import type { ComponentProps, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '~/utils/tailwind-utils';

export interface InputLegendProps extends ComponentProps<'legend'> {
  children: ReactNode;
  required?: boolean;
}

export function InputLegend(props: InputLegendProps) {
  const { t } = useTranslation('gcweb');
  const { children, className, required, ...restProps } = props;

  return (
    <legend className={cn('block', className)} {...restProps}>
      <span className="font-semibold">{children}</span>
      {required && (
        // Using a regular space entity (&#32;) to ensure consistent spacing before the required text,
        // preventing accidental collapse or omission in rendering.
        <>
          &#32;<span aria-hidden="true">({t('input-legend.required')})</span>
        </>
      )}
    </legend>
  );
}
