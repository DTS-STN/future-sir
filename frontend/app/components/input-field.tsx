import { useId } from 'react';
import type { ComponentProps } from 'react';

import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tailwind-utils';

export interface InputFieldProps extends ComponentProps<'input'> {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  label: string;
  name: string;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

export function InputField({
  'aria-describedby': ariaDescribedby,
  errorMessage,
  className,
  helpMessagePrimary,
  helpMessagePrimaryClassName,
  helpMessageSecondary,
  helpMessageSecondaryClassName,
  id,
  label,
  required,
  type = 'text',
  ...rest
}: InputFieldProps) {
  const defaultId = useId();
  const baseId = `input-${type}-field-${id ?? defaultId}`;
  const ids = {
    wrapper: baseId,
    label: `${baseId}-label`,
    input: `${baseId}-input`,
    error: `${baseId}-error`,
    help: {
      primary: `${baseId}-help-primary`,
      secondary: `${baseId}-help-secondary`,
    },
  };

  const ariaDescribedbyIds =
    [
      ariaDescribedby, //
      !!helpMessagePrimary && ids.help.primary,
      !!helpMessageSecondary && ids.help.secondary,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div id={ids.wrapper} className="space-y-2">
      <InputLabel id={ids.label} htmlFor={id} required={required}>
        {label}
      </InputLabel>
      {errorMessage && (
        <p>
          <InputError id={ids.error}>{errorMessage}</InputError>
        </p>
      )}
      {helpMessagePrimary && (
        <InputHelp id={ids.help.primary} className={helpMessagePrimaryClassName}>
          {helpMessagePrimary}
        </InputHelp>
      )}
      <input
        aria-describedby={ariaDescribedbyIds}
        aria-errormessage={errorMessage ? ids.error : undefined}
        aria-invalid={errorMessage ? true : undefined}
        aria-labelledby={ids.label}
        aria-required={required ? true : undefined}
        className={cn(
          'block rounded-lg border-gray-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500 focus:outline-hidden',
          'read-only:pointer-events-none read-only:bg-gray-100 read-only:opacity-70',
          'disabled:pointer-events-none disabled:bg-gray-100 disabled:opacity-70',
          'aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500',
          className,
        )}
        id={ids.input}
        required={required}
        type={type}
        {...rest}
      />
      {helpMessageSecondary && (
        <InputHelp id={ids.help.secondary} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}
