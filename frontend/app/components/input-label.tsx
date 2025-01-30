import type { ComponentProps, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '~/utils/tailwind-utils';

export interface InputLabelProps extends ComponentProps<'label'> {
  children: ReactNode;
  id: string;
  required?: boolean;
}

export function InputLabel(props: InputLabelProps) {
  const { t } = useTranslation('gcweb');
  const { children, className, required, ...restProps } = props;

  return (
    <label className={cn('block', className)} {...restProps}>
      <span className="font-semibold">{children}</span>
      {required && (
        // Using a regular space entity (&#32;) to ensure consistent spacing before the required text,
        // preventing accidental collapse or omission in rendering.
        <>
          &#32;<span aria-hidden="true">({t('input-label.required')})</span>
        </>
      )}
    </label>
  );
}
